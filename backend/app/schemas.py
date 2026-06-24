from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.models import ObjectType


class Vec3(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class Vec3One(BaseModel):
    x: float = 1.0
    y: float = 1.0
    z: float = 1.0


class SceneObjectBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: ObjectType
    position: Vec3 = Field(default_factory=Vec3)
    rotation: Vec3 = Field(default_factory=Vec3)
    scale: Vec3One = Field(default_factory=Vec3One)
    metadata: dict = Field(
        default_factory=dict,
        validation_alias=AliasChoices("meta", "metadata"),
    )


class SceneObjectCreate(SceneObjectBase):
    pass


class SceneObjectUpdate(BaseModel):
    position: Vec3 | None = None
    rotation: Vec3 | None = None
    scale: Vec3One | None = None
    metadata: dict | None = None


class SceneObjectRead(SceneObjectBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    scene_id: uuid.UUID
    created_at: datetime


class SceneBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class SceneCreate(SceneBase):
    pass


class SceneUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    thumbnail: str | None = None


class SceneSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    thumbnail: str | None
    object_count: int
    created_at: datetime
    updated_at: datetime


class SceneDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    thumbnail: str | None
    created_at: datetime
    updated_at: datetime
    objects: list[SceneObjectRead]


class SceneObjectExport(BaseModel):
    """Transport shape for export/import. No server-assigned ids or timestamps."""

    type: ObjectType
    position: Vec3 = Field(default_factory=Vec3)
    rotation: Vec3 = Field(default_factory=Vec3)
    scale: Vec3One = Field(default_factory=Vec3One)
    metadata: dict = Field(default_factory=dict)


class SceneExport(BaseModel):
    schema_version: int = 1
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    objects: list[SceneObjectExport] = Field(default_factory=list)


class EventLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    scene_id: uuid.UUID
    action: str
    payload: dict
    timestamp: datetime


class ErrorResponse(BaseModel):
    detail: str
    code: str
