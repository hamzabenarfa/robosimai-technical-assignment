from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import SceneNotFound
from app.models import Scene, SceneObject
from app.schemas import SceneCreate, SceneUpdate
from app.services.event_service import log_event


def list_scenes(db: Session) -> list[dict]:
    stmt = (
        select(
            Scene.id,
            Scene.name,
            Scene.description,
            Scene.thumbnail,
            Scene.created_at,
            Scene.updated_at,
            func.count(SceneObject.id).label("object_count"),
        )
        .outerjoin(SceneObject, SceneObject.scene_id == Scene.id)
        .group_by(Scene.id)
        .order_by(Scene.created_at.desc())
    )
    rows = db.execute(stmt).mappings().all()
    return [dict(row) for row in rows]


def get_scene(db: Session, scene_id: uuid.UUID) -> Scene:
    scene = db.get(Scene, scene_id)
    if scene is None:
        raise SceneNotFound()
    return scene


def create_scene(db: Session, payload: SceneCreate) -> Scene:
    scene = Scene(name=payload.name, description=payload.description)
    db.add(scene)
    db.flush()
    log_event(
        db,
        scene_id=scene.id,
        action="scene.created",
        payload={"name": scene.name},
    )
    db.commit()
    db.refresh(scene)
    return scene


def update_scene(db: Session, scene_id: uuid.UUID, payload: SceneUpdate) -> Scene:
    scene = get_scene(db, scene_id)
    changes: dict[str, object] = {}
    if payload.name is not None and payload.name != scene.name:
        changes["name"] = {"from": scene.name, "to": payload.name}
        scene.name = payload.name
    if payload.description is not None and payload.description != scene.description:
        changes["description"] = "updated"
        scene.description = payload.description
    # Thumbnail updates intentionally do not produce an event — they fire on
    # every Save and would drown the log.
    if payload.thumbnail is not None and payload.thumbnail != scene.thumbnail:
        scene.thumbnail = payload.thumbnail

    if changes:
        log_event(db, scene_id=scene.id, action="scene.updated", payload=changes)
    db.commit()
    db.refresh(scene)
    return scene


def delete_scene(db: Session, scene_id: uuid.UUID) -> None:
    scene = get_scene(db, scene_id)
    db.delete(scene)
    db.commit()
