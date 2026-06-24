# RoboSim Scene Manager

A small full-stack web app to create, view, edit, and save simple 3D robotics simulation scenes.

This is **not** a simulator — it's a CRUD app with a 3D viewport, built as a take-home assignment.

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
npm install
npm run dev   # http://localhost:5173
```

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (SPA)                       │
│  React 18 + Vite + TS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Scene List   │  │ Scene Editor │  │ 3D Viewer    │    │
│  │ page         │  │ page         │  │ (R3F Canvas) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │ Zustand store (scene, selectedObjectId, dirty) │
└─────────┼─────────────────────────────────────────────── ┘
          │  REST / JSON  (nginx proxies /api → backend)
┌─────────▼─────────────────────────────────────────────── ┐
│                  FastAPI backend                         │
│  routers (HTTP) → services (logic+logging) → models (DB) │
│  Pydantic schemas, consistent error handler              │
│  Every mutation writes one event_log row                 │
└─────────┬─────────────────────────────────────────────── ┘
          │  SQLAlchemy 2.0
┌─────────▼─────────────────────────────────────────────── ┐
│                  PostgreSQL 16                           │
│  scenes · scene_objects · event_logs                     │
└─────────────────────────────────────────────────────────┘
```

**Three Docker services orchestrated by Compose:**

- `postgres` — official image, named volume, healthcheck.
- `backend` — FastAPI on 8000. Runs `alembic upgrade head` on entrypoint, then `uvicorn`.
- `frontend` — Vite build served by nginx on 80 (exposed as 8080). nginx reverse-proxies `/api` and `/docs` to the backend.

**Backend layering rule:** `router` (HTTP only) → `service` (business logic + event logging) → `model` (SQLAlchemy ORM). Routers never touch the DB directly beyond passing the session into services.

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
- **Zustand for state.** One small store for `scene`, `selectedObjectId`, and a `dirty` map. No Redux ceremony.
- **Tailwind for styling.** Lets the UI feel clean without bespoke CSS.
- **Primitives, not GLTF.** Every object type is a colored Three.js primitive (`box`, `cylinder + sphere`, etc.). This keeps scenes trivially serializable and avoids an asset pipeline. See spec §13 — explicit anti-over-engineering.
- **Transforms as JSON blobs.** `position` / `rotation` / `scale` are stored as `JSONB`, not nine columns. They're always read and written together and never queried per-axis. Trade-off: not SQL-queryable per axis, in exchange for a much simpler schema.
- **Explicit save, not autosave.** Local edits set a `dirty` flag; the `Save` button issues PUTs and then refetches the event log. Easier to reason about than autosave on every drag and avoids spamming the API.
- **Event log is first-class.** Every mutating service writes one `event_logs` row in the same transaction (`scene.created`, `object.added`, `object.updated`, `object.deleted`, `scene.updated`). The editor's bottom panel shows them newest-first.
- **Consistent error envelope.** A single exception handler maps `AppError`, `HTTPException`, validation errors, and uncaught exceptions to `{detail, code}` — directly addressing the "Error handling" rubric line.
- **Non-root container user.** The backend container drops to UID 1001 after deps are installed.

---

## 5. Known limitations

- **No authentication.** By design — out of scope for the assignment.
- **No multi-user / collaboration.** Single-tenant editing.
- **No undo/redo.** The save model is "edit then save"; you can revert by reloading.
- **No physics or collision.** Not a simulator.
- **Primitives only.** No real GLTF robot meshes (intentional, see §4).
- **No optimistic UI.** Object adds round-trip to the server before showing locally.
- **Scene list is unpaginated.** Fine for the take-home; a `limit/offset` cursor would be the obvious next step.

---

## 6. Improvements with more time

- Undo/redo via the existing `event_logs` history.
- Optimistic add/move with rollback on API failure.
- Real GLTF model for one type (e.g. the robot) as a polish step.
- Pagination + search on the scene list.
- Websocket live event stream so multiple users see edits in real time.
- Scene import/export JSON (cheap and high-impact; left for a follow-up).
- Backend pytest coverage for the service layer; Playwright happy-path E2E.
- GitHub Actions CI (lint + test on push).

---

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
│   │   ├── api/client.ts
│   │   ├── store/useSceneStore.ts
│   │   ├── pages/             # SceneListPage, SceneEditorPage
│   │   ├── components/
│   │   │   ├── viewer/        # R3F canvas + gizmo + primitive meshes
│   │   │   ├── inspector/     # AddObjectMenu, Inspector
│   │   │   ├── EventLogPanel.tsx
│   │   │   └── Toast.tsx
│   │   ├── lib/objectDefaults.ts
│   │   └── types.ts
│   ├── Dockerfile             # build → nginx
│   └── nginx.conf             # /api → backend
├── docs/SPEC.md
├── docker-compose.yml
└── README.md
```
