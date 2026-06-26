# RoboSim Scene Manager

A small full-stack web app to create, view, edit, and save simple 3D robotics simulation scenes.

This is **not** a simulator — it's a CRUD app with a 3D viewport, built as a take-home assignment.

> **At a glance** — one command, no config:
>
> ```bash
> docker compose up --build      #  → app at http://localhost:8080  ·  API docs at /docs
> ```
>
> **Stack:** FastAPI + PostgreSQL · React + R3F + TanStack Query + Zustand · Docker Compose.
> **Read next:** [Architecture](#2-architecture) · [API](#3-api-overview) · [Design decisions](#4-design-decisions) · [Limitations](#5-known-limitations).

---

## 1. Setup

**Prerequisites:** Docker 24+ and Docker Compose v2.

```bash
docker compose up --build
```

That's the only command. Three services come up:

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | <http://localhost:8080>          |
| API docs | <http://localhost:8080/docs>     |
| Backend  | <http://localhost:8000>          |

The backend automatically applies Alembic migrations on start, so the database is ready as soon as the stack is healthy.

If those ports are already in use, override them per-run without editing the file:

```bash
FRONTEND_PORT=8090 BACKEND_PORT=8001 POSTGRES_PORT=5433 \
CORS_ORIGINS=http://localhost:8090 docker compose up --build
```

To stop and wipe the database:

```bash
docker compose down -v
```

### Local development (without Docker)

```bash
# Backend (needs a Postgres reachable at DATABASE_URL)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (proxies /api → localhost:8000)
cd frontend
bun install
bun run dev   # http://localhost:5173
```

---

## 2. Architecture

Three Docker services orchestrated by a single Compose file. The browser only ever talks to the frontend container; nginx reverse-proxies `/api` and `/docs` through to the backend, so there is no CORS surface in production and one origin to reason about.

```mermaid
flowchart TB
    subgraph browser["🌐 Browser — React 18 SPA"]
        direction LR
        list["Scene List<br/>page"]
        editor["Scene Editor<br/>page"]
        viewer["3D Viewport<br/>(R3F Canvas)"]
        list -.-> editor -.-> viewer
        store(["Zustand store<br/>selectedObjectId · dirty edits"])
        query(["TanStack Query<br/>server cache"])
    end

    subgraph frontendC["📦 frontend container"]
        nginx["nginx<br/>serves static build<br/>proxies /api + /docs"]
    end

    subgraph backendC["⚙️ backend container — FastAPI"]
        direction TB
        router["routers · HTTP only"]
        service["services · logic + event logging"]
        model["models · SQLAlchemy 2.0"]
        router --> service --> model
    end

    subgraph dbC["🗄️ postgres container"]
        pg[("PostgreSQL 16<br/>scenes · scene_objects · event_logs")]
    end

    browser -->|"REST / JSON"| nginx
    nginx -->|"/api/*"| router
    model -->|"SQLAlchemy"| pg

    classDef c fill:#1e293b,stroke:#475569,color:#e2e8f0;
    class list,editor,viewer,store,query,nginx,router,service,model,pg c;
```

**Three Docker services:**

- `postgres` — official image, named volume for persistence, healthcheck so dependants wait for it.
- `backend` — FastAPI on 8000. Entrypoint runs `alembic upgrade head`, then `uvicorn`. Drops to a non-root user.
- `frontend` — Vite production build served by nginx on 80 (published as 8080). nginx reverse-proxies `/api` and `/docs` to the backend.

**Backend layering rule:** `router` (HTTP only) → `service` (business logic + event logging) → `model` (SQLAlchemy ORM). Routers never touch the DB directly beyond passing the session into services — this keeps the logic unit-testable and easy to defend.

### Data model

Three tables. `ON DELETE CASCADE` means deleting a scene cleans up its objects and event history in one statement. Transforms live in `JSONB` because they are always read and written together and never queried per-axis.

```mermaid
erDiagram
    SCENES ||--o{ SCENE_OBJECTS : "contains"
    SCENES ||--o{ EVENT_LOGS : "records"

    SCENES {
        uuid id PK
        varchar name "1–120 chars"
        text description "nullable"
        text thumbnail "base64 JPEG, nullable"
        timestamptz created_at
        timestamptz updated_at "auto-updated"
    }
    SCENE_OBJECTS {
        uuid id PK
        uuid scene_id FK "cascade"
        enum type "robot|box|shelf|conveyor|obstacle"
        jsonb position "x,y,z"
        jsonb rotation "x,y,z radians"
        jsonb scale "x,y,z"
        jsonb metadata "free-form"
    }
    EVENT_LOGS {
        uuid id PK
        uuid scene_id FK "cascade"
        varchar action "object.added, scene.updated, …"
        jsonb payload "what changed"
        timestamptz timestamp
    }
```

### Save flow

Edits are local-first: the inspector and gizmo mutate the Zustand store and mark objects `dirty`. **Save** flushes only the changed objects, and every mutation writes one `event_logs` row in the *same transaction* — so the event panel and the DB can never disagree.

```mermaid
sequenceDiagram
    actor User
    participant UI as Editor (React)
    participant Q as TanStack Query
    participant API as FastAPI router
    participant SVC as service
    participant DB as PostgreSQL

    User->>UI: drag gizmo / edit inspector
    UI->>UI: update Zustand store (dirty = true)
    User->>UI: click Save
    UI->>API: PUT /api/scenes/{id}/objects/{objId}
    API->>SVC: update_object(...)
    SVC->>DB: UPDATE object + INSERT event_log
    Note over SVC,DB: one transaction — both or neither
    DB-->>SVC: committed
    SVC-->>API: updated object
    API-->>UI: 200 OK
    UI->>Q: invalidate scene + events
    Q->>API: GET /api/scenes/{id}/events
    API-->>Q: fresh event log
    Q-->>User: panel updates, dirty cleared
```

---

## 3. API overview

Base path: `/api`. JSON in, JSON out. Interactive docs at `/docs`.

### Scenes

| Method | Path                | Purpose                            | Success | Errors      |
| ------ | ------------------- | ---------------------------------- | ------- | ----------- |
| POST   | `/api/scenes`       | Create scene                       | 201     | 422         |
| GET    | `/api/scenes`       | List scenes (id, name, counts)     | 200     | —           |
| GET    | `/api/scenes/{id}`  | Get full scene with objects        | 200     | 404         |
| PUT    | `/api/scenes/{id}`  | Update name/description            | 200     | 404, 422    |
| DELETE | `/api/scenes/{id}`  | Delete scene (cascades)            | 204     | 404         |

### Objects (nested under a scene)

| Method | Path                                       | Purpose                       | Success | Errors   |
| ------ | ------------------------------------------ | ----------------------------- | ------- | -------- |
| POST   | `/api/scenes/{id}/objects`                 | Add object                    | 201     | 404, 422 |
| PUT    | `/api/scenes/{id}/objects/{objId}`         | Update transform / metadata   | 200     | 404, 422 |
| DELETE | `/api/scenes/{id}/objects/{objId}`         | Delete object                 | 204     | 404      |

### Events

| Method | Path                                       | Purpose                        |
| ------ | ------------------------------------------ | ------------------------------ |
| GET    | `/api/scenes/{id}/events?limit=50`         | Recent event logs (newest first) |

### Import / export (bonus)

| Method | Path                          | Purpose                                          |
| ------ | ----------------------------- | ------------------------------------------------ |
| GET    | `/api/scenes/{id}/export`     | Download scene + objects as portable JSON         |
| POST   | `/api/scenes/import`          | Create a new scene from an uploaded JSON payload  |

The editor has an **↓ Export scene as JSON** button; the scene list has **↑ Import JSON**. Import re-generates server IDs so a round-trip yields a clean duplicate.

### Error response shape

Every error — 422, 404, 500 — comes out the same way:

```json
{ "detail": "Scene not found", "code": "SCENE_NOT_FOUND" }
```

Validation errors additionally include the underlying field errors under `errors`.

---

## 4. Design decisions

- **FastAPI + Pydantic v2.** Free request/response validation, automatic OpenAPI docs at `/docs`, structured error responses.
- **SQLAlchemy 2.0 + Alembic.** Standard, explainable, and gives a real migration story.
- **PostgreSQL.** Pairs cleanly with Compose; the `JSONB` column type stores transforms naturally. SQLite would have been defensible too, but Postgres made the JSONB choice for transforms easier.
- **React 18 + Vite + TypeScript.** Fast dev loop, typed props, small footprint.
- **React Three Fiber + drei.** Declarative Three.js, with `OrbitControls` and `TransformControls` saving hours of glue code.
- **Server state vs. client state, split deliberately.** **TanStack Query** owns everything that lives on the server — the scene list, a single scene, the event log — with cache keys, loading/error states, and invalidation on mutation handled for free (`src/api/queries.ts`, `mutations.ts`). **Zustand** owns only ephemeral *editor* state that never round-trips: the selected object id and the map of locally-edited (`dirty`) objects. Keeping the two concerns separate is why neither store grows a tangle of fetch/loading flags.
- **Zod for boundary validation.** API responses and imported scene files are parsed through Zod schemas (`src/schemas/`); the TypeScript types are *inferred* from those schemas, so the runtime check and the compile-time type can never drift. This replaced a hand-maintained `types.ts`.
- **Tailwind for styling.** Lets the UI feel clean without bespoke CSS.
- **Primitives, not GLTF.** Every object type is a colored Three.js primitive (`box`, `cylinder + sphere`, etc.). This keeps scenes trivially serializable and avoids an asset pipeline. See spec §13 — explicit anti-over-engineering.
- **Transforms as JSON blobs.** `position` / `rotation` / `scale` are stored as `JSONB`, not nine columns. They're always read and written together and never queried per-axis. Trade-off: not SQL-queryable per axis, in exchange for a much simpler schema.
- **Explicit save, not autosave.** Local edits set a `dirty` flag; the `Save` button issues PUTs and then refetches the event log. Easier to reason about than autosave on every drag and avoids spamming the API.
- **Event log is first-class.** Every mutating service writes one `event_logs` row in the same transaction (`scene.created`, `object.added`, `object.updated`, `object.deleted`, `scene.updated`). The editor's bottom panel shows them newest-first.
- **Consistent error envelope.** A single exception handler maps `AppError`, `HTTPException`, validation errors, and uncaught exceptions to `{detail, code}` — directly addressing the "Error handling" rubric line.
- **Non-root container user.** The backend container drops to UID 1001 after deps are installed.
- **Viewport thumbnails.** When the user adds an object or hits Save, the React Three Fiber canvas is sampled (`preserveDrawingBuffer: true`), downscaled to 480×270, encoded as JPEG, and stored on `scenes.thumbnail` (TEXT, base64 data URL). The scene list shows those as card art. Stored inline because the volume is tiny (~20 KB each) for the take-home; a real product would push them to object storage.
- **Blender-style viewport controls.** Middle-mouse rotates, right-mouse pans, wheel zooms. Left-mouse also rotates as a trackpad fallback. Click selects through to the mesh (stopPropagation is set on the mesh's onClick).
- **Keyboard parity with toolbar.** G/R/S switch gizmo mode, F frames the selected object, Numpad 1/3/7 snap to front/right/top, X/Delete removes the selection, Esc deselects. The vertical icon toolbar mirrors every shortcut so mouse-only users have the same affordances. A `?` overlay summarises everything. Keys are ignored when an input is focused.
- **Decoupled viewport commands.** Toolbar buttons and keyboard handlers both dispatch a single `viewport:cmd` window event; a listener inside the R3F canvas runs the camera/controls work. One implementation, two surfaces.

---

## 5. Known limitations

- **No authentication.** By design — out of scope for the assignment.
- **No multi-user / collaboration.** Single-tenant editing.
- **No undo/redo.** The save model is "edit then save"; you can revert by reloading.
- **No physics or collision.** Not a simulator.
- **Primitives only.** No real GLTF robot meshes (intentional, see §4).
- **No optimistic UI.** Object adds round-trip to the server before showing locally.
- **Scene list is unpaginated.** Fine for the take-home; a `limit/offset` cursor would be the obvious next step.
- **Thumbnails live in the DB.** Convenient for one-command deploy, but a real product would push them to object storage and serve via a CDN.
- **Frontend bundle is single-chunk** (~1 MB unminified). Vite warns; lazy-loading the R3F editor route would shrink the landing page.

---

## 6. Improvements with more time

- Undo/redo via the existing `event_logs` history.
- Optimistic add/move with rollback on API failure.
- Real GLTF model for one type (e.g. the robot) as a polish step.
- Pagination + search on the scene list.
- Websocket live event stream so multiple users see edits in real time.
- Frontend Playwright happy-path E2E.
- Route-level code splitting to shrink the initial bundle below Vite's 500 KB warning threshold.
- Object storage + signed-URL serving for thumbnails.

---

## Tests

Backend service-layer tests run against a dedicated `robosim_test` database using a SAVEPOINT-rollback fixture (see `backend/tests/conftest.py`), so they don't pollute dev data.

```bash
cd backend
pip install -r requirements-dev.txt
TEST_DATABASE_URL=postgresql+psycopg://robosim:robosim@localhost:5433/robosim_test \
  pytest
```

GitHub Actions runs the same suite (with a Postgres service container) plus a frontend `bun run build` on every push — see `.github/workflows/ci.yml`.

## Editor controls

| Action | Mouse | Key |
| --- | --- | --- |
| Orbit camera | middle drag (left as trackpad fallback) | — |
| Pan camera | right drag | — |
| Zoom | wheel | — |
| Select object | click | — |
| Deselect | click empty | `Esc` |
| Gizmo: translate / rotate / scale | toolbar | `G` / `R` / `S` |
| Frame selected | toolbar | `F` |
| Front / right / top view | toolbar | Numpad `1` / `3` / `7` |
| Delete selected | toolbar | `X` or `Delete` |

The `?` button in the top-right of the viewport shows the same list in-app.

## Repository layout

```
.
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app factory, exception handlers
│   │   ├── models.py          # SQLAlchemy ORM
│   │   ├── schemas.py         # Pydantic v2 request/response
│   │   ├── database.py        # engine, session
│   │   ├── config.py          # env-driven settings
│   │   ├── errors.py          # AppError + handlers
│   │   ├── routers/           # HTTP layer (scenes, objects, events)
│   │   └── services/          # business logic + event logging
│   ├── alembic/               # migrations
│   ├── Dockerfile
│   ├── entrypoint.sh          # alembic upgrade head → uvicorn
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── http.ts            # low-level fetch + error envelope parsing
│   │   │   ├── client.ts          # typed endpoint wrappers
│   │   │   ├── queries.ts         # TanStack Query read hooks
│   │   │   ├── mutations.ts       # TanStack Query write hooks (cache invalidation)
│   │   │   └── queryKeys.ts       # query-key factory
│   │   ├── schemas/               # Zod schemas + inferred types (replaces types.ts)
│   │   ├── store/useSceneStore.ts # Zustand: local editor state (selection, dirty edits)
│   │   ├── hooks/                 # useUnsavedChangesGuard, etc.
│   │   ├── pages/                 # SceneListPage, SceneEditorPage
│   │   ├── components/
│   │   │   ├── viewer/            # R3F canvas + gizmo + primitive meshes
│   │   │   ├── inspector/         # AddObjectMenu, Inspector
│   │   │   ├── scenes/            # SceneCard, SceneForm, ScenesEmptyState
│   │   │   ├── ui/                # Toast, ConfirmModal, Skeleton
│   │   │   ├── icons/
│   │   │   └── EventLogPanel.tsx
│   │   └── lib/                   # objectDefaults, sceneFile, captureViewport, shortcuts
│   ├── Dockerfile                 # build → nginx
│   └── nginx.conf                 # /api → backend
├── docs/SPEC.md
├── docker-compose.yml
└── README.md
```
