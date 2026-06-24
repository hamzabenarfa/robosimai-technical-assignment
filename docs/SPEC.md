# RoboSim Scene Manager — Technical Spec / Build Plan

> Internal build document for the RoboSim AI take-home assignment.
> Audience: the engineer building it (you). Also doubles as the source for the final `README.md`.

---

## 1. Goal & scope

Build a small full-stack web app to **create, view, edit, and save simple 3D robotics simulation scenes**.

This is **not** a simulator. It is a CRUD app with a 3D viewport. The grading rewards a clean, finished, reproducible system over feature count.

**Explicit constraints from the brief:**
- No authentication.
- Do not over-engineer.
- A smaller, polished solution beats a large unfinished one.
- You must be able to explain every line in a follow-up interview.

**Hard time budget:** 1–2 days. Treat anything beyond the "Must-have" list in §9 as optional.

---

## 2. What the graders actually score

The rubric maps to specific build decisions. Keep this table in view the whole time.

| Rubric line | Where you earn it |
|---|---|
| Code quality | Small, named functions; typed models; no dead code |
| Backend API design | RESTful routes, correct status codes, Pydantic validation |
| Frontend architecture | Clear component split, one state store, no prop-drilling |
| 3D/WebGL implementation | Render + click-select + edit transform |
| UX clarity | Obvious flow: list → open → edit → save |
| Data modeling | Scene / Object / Event schema (see §5) |
| Docker/local deployment quality | `docker compose up` works first try on a clean machine |
| Error handling | Structured error responses, validation messages, frontend toasts |
| README quality | Six required sections, all present (see §11) |
| Engineering judgment | Scope discipline — primitives not GLTF, SQLite if it fits |
| Ability to explain code | Don't paste anything you can't defend |

---

## 3. Tech stack (chosen for defensibility)

| Layer | Choice | One-line justification (for README "design decisions") |
|---|---|---|
| Backend | **FastAPI + Pydantic v2** | Validation and clear error responses come almost free; auto OpenAPI docs satisfy the "API overview" deliverable |
| ORM | **SQLAlchemy 2.0 + Alembic** | Standard, explainable, migration story |
| Database | **PostgreSQL 16** (containerized) | Pairs cleanly with Compose. *Alternative: SQLite — defensible as "right-sized." Pick one and state why.* |
| Frontend | **React 18 + Vite + TypeScript** | Fast dev server, typed props, small footprint |
| 3D | **React Three Fiber + @react-three/drei** | Declarative Three.js; `OrbitControls` + `TransformControls` save hours |
| State | **Zustand** | Minimal boilerplate vs Redux; one store for selection + scene |
| HTTP client | **fetch** wrapped in a thin `api.ts` | No need for axios |
| Styling | **Tailwind CSS** (or plain CSS modules) | Clean, not polished — don't gold-plate |

> **3D models question — settled:** Do **not** download or load `.glb`/`.gltf` robot models. Represent every object type with a colored Three.js **primitive** (box, cylinder, sphere). This is the correct judgment call, not a shortcut — it keeps scenes trivially serializable and matches "do not over-engineer." Loading a real GLTF for one type is the *last* optional polish step, nothing more.

---

## 4. System architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (SPA)                        │
│  React + Vite + TS                                        │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Scene List    │  │ Scene Editor │  │ 3D Viewer     │  │
│  │ page          │  │ page         │  │ (R3F Canvas)  │  │
│  └───────────────┘  └──────────────┘  └───────────────┘  │
│         │ Zustand store (scenes, selectedObjectId)        │
└─────────┼────────────────────────────────────────────────┘
          │  REST / JSON  (Vite proxy → backend)
┌─────────▼────────────────────────────────────────────────┐
│                  FastAPI backend                          │
│  routers → services → SQLAlchemy models                   │
│  Pydantic schemas (request/response validation)           │
│  Event logging on every mutation                          │
└─────────┬────────────────────────────────────────────────┘
          │  SQLAlchemy
┌─────────▼────────────────────────────────────────────────┐
│                  PostgreSQL                               │
│  scenes · scene_objects · event_logs                      │
└──────────────────────────────────────────────────────────┘

   All three services orchestrated by docker-compose.
```

**Layering rule (backend):** `router` (HTTP only) → `service` (business logic + logging) → `model` (DB). Routers never touch the DB session directly beyond passing it down. This keeps logic testable and is easy to explain.

---

## 5. Data model

Three tables. This is the heart of the "Data modeling" score.

### `scenes`
| column | type | notes |
|---|---|---|
| id | UUID (PK) | server-generated |
| name | varchar, required | 1–120 chars |
| description | text | optional |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | auto-updated on change |

### `scene_objects`
| column | type | notes |
|---|---|---|
| id | UUID (PK) | server-generated |
| scene_id | UUID (FK → scenes.id) | `ON DELETE CASCADE` |
| type | enum | `robot \| box \| shelf \| conveyor \| obstacle` |
| position | JSON `{x,y,z}` | floats, default 0 |
| rotation | JSON `{x,y,z}` | radians, default 0 |
| scale | JSON `{x,y,z}` | floats, default 1 |
| metadata | JSON | free-form key/values |

> **Design decision to note:** transforms stored as JSON blobs (not 9 separate columns) because they're always read/written together and never queried individually. State the trade-off in the README: simpler schema vs. not SQL-queryable per-axis.

### `event_logs`
| column | type | notes |
|---|---|---|
| id | UUID (PK) | |
| scene_id | UUID (FK → scenes.id) | `ON DELETE CASCADE` |
| action | varchar | e.g. `scene.created`, `object.added`, `object.updated`, `object.deleted`, `scene.updated` |
| payload | JSON | small snapshot: which object, what changed |
| timestamp | timestamptz | default now() |

**Event logging is a first-class requirement, not an afterthought.** Every mutating service function writes one `event_log` row in the same transaction. This is the single most under-delivered part of this assignment — wire it in from the first endpoint.

---

## 6. API design

Base path: `/api`. JSON in, JSON out. FastAPI auto-serves docs at `/docs` (use this as your "API overview").

### Scenes
| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| POST | `/api/scenes` | Create scene | 201 | 422 validation |
| GET | `/api/scenes` | List scenes (id, name, description, counts) | 200 | — |
| GET | `/api/scenes/{id}` | Get full scene + objects | 200 | 404 |
| PUT | `/api/scenes/{id}` | Update name/description | 200 | 404, 422 |
| DELETE | `/api/scenes/{id}` | Delete scene (cascades) | 204 | 404 |

### Objects (nested under scene)
| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| POST | `/api/scenes/{id}/objects` | Add object | 201 | 404, 422 |
| PUT | `/api/scenes/{id}/objects/{objId}` | Update object transform/metadata | 200 | 404, 422 |
| DELETE | `/api/scenes/{id}/objects/{objId}` | Delete object | 204 | 404 |

### Events
| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/scenes/{id}/events?limit=50` | Recent event logs, newest first | 200 |

### Bonus (optional)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/scenes/{id}/export` | Download scene as JSON |
| POST | `/api/scenes/import` | Create scene from uploaded JSON |

### Error response shape (consistent everywhere)
```json
{ "detail": "Scene not found", "code": "SCENE_NOT_FOUND" }
```
Use FastAPI exception handlers so every error — validation, 404, 500 — comes out in this shape. This directly scores the "Error handling" rubric line.

---

## 7. Frontend structure

```
src/
├── main.tsx
├── App.tsx                  # router: /  and  /scenes/:id
├── api/
│   └── client.ts            # typed fetch wrappers, throws on !ok
├── store/
│   └── useSceneStore.ts     # Zustand: scene, objects, selectedObjectId, dirty flag
├── pages/
│   ├── SceneListPage.tsx    # table of scenes, create button, delete
│   └── SceneEditorPage.tsx  # layout: viewer + inspector + event log
├── components/
│   ├── viewer/
│   │   ├── SceneCanvas.tsx      # <Canvas>, lights, grid, OrbitControls
│   │   ├── SceneObject.tsx      # switch on type → primitive mesh, onClick select
│   │   └── ObjectGizmo.tsx      # <TransformControls> bound to selected object
│   ├── inspector/
│   │   ├── Inspector.tsx        # edits position/rotation/scale/metadata
│   │   └── AddObjectMenu.tsx    # buttons: add box / robot / shelf / ...
│   ├── EventLogPanel.tsx        # recent events, polled or refetched on save
│   └── Toast.tsx                # error + success feedback
```

**Editor page layout (3 columns):**
```
┌──────────────┬───────────────────────────┬──────────────┐
│ Add objects  │                           │  Inspector   │
│  + box       │       3D Viewport         │  type: box   │
│  + robot     │   (click an object to     │  pos x/y/z   │
│  + shelf     │    select; gizmo to move) │  rot x/y/z   │
│  + conveyor  │                           │  scale x/y/z │
│  + obstacle  │                           │  metadata    │
├──────────────┴───────────────────────────┤  [Save]      │
│ Event log: object.added robot · 12:04 …   │              │
└───────────────────────────────────────────┴──────────────┘
```

**Selection pattern (the one fiddly part):** each `SceneObject` mesh gets `onClick={(e) => { e.stopPropagation(); select(obj.id) }}`. `stopPropagation` prevents click-through to objects behind. Selected object id lives in the Zustand store; the Inspector and `TransformControls` both read from it.

**Save model:** edits mutate local store (`dirty = true`); the **Save** button PUTs changed objects to the backend, then refetches the event log. Keep it explicit — don't autosave on every drag (too many requests, harder to explain).

---

## 8. 3D object type → primitive mapping

| type | geometry | default color | default scale hint |
|---|---|---|---|
| box | `boxGeometry [1,1,1]` | amber | cube |
| robot | `cylinderGeometry` body + `sphereGeometry` head | blue | upright |
| shelf | `boxGeometry [2,3,0.5]` | gray | tall, thin |
| conveyor | `boxGeometry [4,0.2,1]` | dark gray | flat, wide |
| obstacle | `coneGeometry` or `sphereGeometry` | red | small |

Add a **ground grid** (`<gridHelper>` or drei `<Grid>`) and an **OrbitControls** camera so the scene is navigable. Lights: one `ambientLight` + one `directionalLight`.

---

## 9. Build order & milestones

Build vertically (one feature end-to-end) rather than all-backend-then-all-frontend. You always have something demoable.

### Phase 0 — Skeleton (1–2 hrs)
- [ ] Repo init, folder structure, `.gitignore`
- [ ] `docker-compose.yml` with empty backend + frontend + postgres, `docker compose up` builds
- [ ] FastAPI "hello" route reachable; Vite app loads

### Phase 1 — Backend core (3–4 hrs)
- [ ] SQLAlchemy models + Alembic initial migration
- [ ] Pydantic schemas (create/update/response for scene + object)
- [ ] Scene CRUD endpoints with validation + 404 handling
- [ ] Object add/update/delete endpoints
- [ ] **Event logging in every mutation** + events endpoint
- [ ] Consistent error handler

### Phase 2 — Frontend core (4–5 hrs)
- [ ] API client + Zustand store
- [ ] Scene list page (list, create, delete)
- [ ] Editor page shell (3-column layout)
- [ ] R3F canvas: render objects from scene data as primitives
- [ ] Add-object buttons (≥3 types — do all 5, they're cheap)

### Phase 3 — Interaction (3–4 hrs)
- [ ] Click to select object (highlight selected)
- [ ] Inspector edits position/rotation/scale/metadata
- [ ] `TransformControls` gizmo for drag-move
- [ ] Save button → PUT changes → refetch
- [ ] Event log panel shows recent events

### Phase 4 — Deploy & docs (2–3 hrs) — **do not skip, heavily weighted**
- [ ] Backend Dockerfile (multi-stage, non-root)
- [ ] Frontend Dockerfile (build → serve static via nginx, or Vite preview)
- [ ] Compose wires all three, healthchecks, depends_on
- [ ] CORS configured for the frontend origin
- [ ] README with all six sections (§11)

### Phase 5 — Bonus (only if time remains, in this order)
1. [ ] Scene import/export JSON (cheapest, high impact)
2. [ ] A handful of backend tests (pytest) — validates "Error handling" credibly
3. [ ] GitHub Actions CI (lint + test on push)
4. [ ] ~~Terraform~~ — lowest ROI for a local-only app; skip unless everything else is done

---

## 10. Docker / local deployment

**Requirements that are graded:** backend Dockerfile, frontend Dockerfile, compose file, README setup.

`docker-compose.yml` services:
```
postgres   → official image, volume for persistence, healthcheck
backend    → build ./backend, depends_on postgres healthy, runs migrations on start, exposes 8000
frontend   → build ./frontend, serves on 8080, proxies /api to backend
```

**The bar:** a reviewer clones the repo and runs **one command** — `docker compose up --build` — and the app works at `http://localhost:8080`. Test this on a clean checkout before submitting. The two classic breakages:
1. **CORS** — set allowed origins explicitly in FastAPI.
2. **Migrations not run** — backend entrypoint should run `alembic upgrade head` before starting uvicorn.

---

## 11. README structure (a graded deliverable)

The brief requires exactly these sections. The README is scored directly, so write it like a deliverable.

1. **Setup instructions** — prerequisites (Docker), the one command, where the app + API docs live.
2. **Architecture overview** — the diagram from §4, the layering rule, why three services.
3. **API overview** — the endpoint table from §6, link to `/docs`.
4. **Design decisions** — stack justifications (§3), JSON-blob transforms trade-off, primitives over GLTF, explicit-save over autosave, event-log-as-first-class.
5. **Known limitations** — no auth (by design), no multi-user, no undo, no physics, primitives only.
6. **Improvements with more time** — undo/redo, real GLTF models, optimistic UI, pagination on scene list, websocket live event stream, Terraform/CI, e2e tests.

---

## 12. Demo video plan (3–7 min, required)

Record **last**, once everything works. Script it so you don't ramble:

1. **(0:00–0:45)** `git clone` → `docker compose up` → app loads. Shows reproducibility.
2. **(0:45–2:00)** Scene list → create a scene → open editor.
3. **(2:00–4:00)** Add a box, robot, shelf → click to select → edit position/rotation in inspector → drag with gizmo → **Save**.
4. **(4:00–5:00)** Show the event log updating. Reload to prove persistence.
5. **(5:00–6:00)** Hit the API directly — open `/docs`, run a GET, show JSON + a 404 error response.
6. Close on one sentence about a known limitation + one improvement you'd make.

---

## 13. Anti-over-engineering checklist

The brief says this twice. Things to **deliberately not do**:
- ❌ No GLTF/asset pipeline (primitives only).
- ❌ No auth, no users, no roles.
- ❌ No Redux — Zustand is enough.
- ❌ No microservices — one backend.
- ❌ No undo/redo, no physics, no collision.
- ❌ No Terraform unless every required + cheaper bonus is already done.
- ❌ No premature optimization, no caching layer.

If you're unsure whether to add something, the brief already answered: **smaller and polished wins.**

---

## 14. Definition of done

- [ ] `docker compose up --build` on a clean clone serves a working app.
- [ ] All 5 scene endpoints + 3 object endpoints + events endpoint work and validate input.
- [ ] Every mutation writes an event log; the panel displays them.
- [ ] Can create a scene, add ≥3 object types, select, edit, save, and see persistence after reload.
- [ ] Errors return the consistent `{detail, code}` shape with correct status codes.
- [ ] README has all six sections.
- [ ] Demo video recorded, 3–7 min.
- [ ] You can explain every file.
