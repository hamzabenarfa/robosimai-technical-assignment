from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import register_exception_handlers
from app.routers import events, objects, scenes


def _build_app() -> FastAPI:
    app = FastAPI(
        title="RoboSim Scene Manager",
        version="0.1.0",
        description=(
            "REST API for creating, viewing, editing and saving simple 3D "
            "robotics simulation scenes."
        ),
    )

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(scenes.router)
    app.include_router(objects.router)
    app.include_router(events.router)

    @app.get("/api/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = _build_app()
