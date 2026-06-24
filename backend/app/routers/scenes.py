from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    SceneCreate,
    SceneDetail,
    SceneSummary,
    SceneUpdate,
)
from app.services import scene_service

router = APIRouter(prefix="/api/scenes", tags=["scenes"])


@router.get("", response_model=list[SceneSummary])
def list_scenes(db: Session = Depends(get_db)) -> list[SceneSummary]:
    rows = scene_service.list_scenes(db)
    return [SceneSummary(**row) for row in rows]


@router.post("", response_model=SceneDetail, status_code=status.HTTP_201_CREATED)
def create_scene(payload: SceneCreate, db: Session = Depends(get_db)) -> SceneDetail:
    scene = scene_service.create_scene(db, payload)
    return SceneDetail.model_validate(scene)


@router.get("/{scene_id}", response_model=SceneDetail)
def read_scene(scene_id: uuid.UUID, db: Session = Depends(get_db)) -> SceneDetail:
    scene = scene_service.get_scene(db, scene_id)
    return SceneDetail.model_validate(scene)


@router.put("/{scene_id}", response_model=SceneDetail)
def update_scene(
    scene_id: uuid.UUID, payload: SceneUpdate, db: Session = Depends(get_db)
) -> SceneDetail:
    scene = scene_service.update_scene(db, scene_id, payload)
    return SceneDetail.model_validate(scene)


@router.delete("/{scene_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scene(scene_id: uuid.UUID, db: Session = Depends(get_db)) -> Response:
    scene_service.delete_scene(db, scene_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
