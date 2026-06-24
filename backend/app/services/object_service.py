from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.errors import ObjectNotFound
from app.models import Scene, SceneObject
from app.schemas import SceneObjectCreate, SceneObjectUpdate
from app.services.event_service import log_event
from app.services.scene_service import get_scene


def _bump_scene(db: Session, scene: Scene) -> None:
    """Touch the parent scene so updated_at moves on every mutation."""
    from sqlalchemy import func

    scene.updated_at = func.now()


def add_object(
    db: Session, scene_id: uuid.UUID, payload: SceneObjectCreate
) -> SceneObject:
    scene = get_scene(db, scene_id)
    obj = SceneObject(
        scene_id=scene.id,
        type=payload.type,
        position=payload.position.model_dump(),
        rotation=payload.rotation.model_dump(),
        scale=payload.scale.model_dump(),
        meta=payload.metadata,
    )
    db.add(obj)
    db.flush()
    _bump_scene(db, scene)
    log_event(
        db,
        scene_id=scene.id,
        action="object.added",
        payload={"object_id": str(obj.id), "type": obj.type.value},
    )
    db.commit()
    db.refresh(obj)
    return obj


def get_object(db: Session, scene_id: uuid.UUID, object_id: uuid.UUID) -> SceneObject:
    obj = db.get(SceneObject, object_id)
    if obj is None or obj.scene_id != scene_id:
        raise ObjectNotFound()
    return obj


def update_object(
    db: Session,
    scene_id: uuid.UUID,
    object_id: uuid.UUID,
    payload: SceneObjectUpdate,
) -> SceneObject:
    scene = get_scene(db, scene_id)
    obj = get_object(db, scene_id, object_id)

    changes: dict[str, object] = {}
    if payload.position is not None:
        obj.position = payload.position.model_dump()
        changes["position"] = obj.position
    if payload.rotation is not None:
        obj.rotation = payload.rotation.model_dump()
        changes["rotation"] = obj.rotation
    if payload.scale is not None:
        obj.scale = payload.scale.model_dump()
        changes["scale"] = obj.scale
    if payload.metadata is not None:
        obj.meta = payload.metadata
        changes["metadata"] = "updated"

    if changes:
        _bump_scene(db, scene)
        log_event(
            db,
            scene_id=scene.id,
            action="object.updated",
            payload={"object_id": str(obj.id), "changes": changes},
        )
    db.commit()
    db.refresh(obj)
    return obj


def delete_object(db: Session, scene_id: uuid.UUID, object_id: uuid.UUID) -> None:
    scene = get_scene(db, scene_id)
    obj = get_object(db, scene_id, object_id)
    obj_type = obj.type.value
    db.delete(obj)
    _bump_scene(db, scene)
    log_event(
        db,
        scene_id=scene.id,
        action="object.deleted",
        payload={"object_id": str(object_id), "type": obj_type},
    )
    db.commit()
