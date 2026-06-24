from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SceneObjectCreate, SceneObjectRead, SceneObjectUpdate
from app.services import object_service

router = APIRouter(prefix="/api/scenes/{scene_id}/objects", tags=["objects"])


@router.post("", response_model=SceneObjectRead, status_code=status.HTTP_201_CREATED)
def add_object(
    scene_id: uuid.UUID,
    payload: SceneObjectCreate,
    db: Session = Depends(get_db),
) -> SceneObjectRead:
    obj = object_service.add_object(db, scene_id, payload)
    return SceneObjectRead.model_validate(obj)


@router.put("/{object_id}", response_model=SceneObjectRead)
def update_object(
    scene_id: uuid.UUID,
    object_id: uuid.UUID,
    payload: SceneObjectUpdate,
    db: Session = Depends(get_db),
) -> SceneObjectRead:
    obj = object_service.update_object(db, scene_id, object_id, payload)
    return SceneObjectRead.model_validate(obj)


@router.delete("/{object_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_object(
    scene_id: uuid.UUID,
    object_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> Response:
    object_service.delete_object(db, scene_id, object_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
