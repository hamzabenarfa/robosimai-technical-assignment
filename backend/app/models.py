from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ObjectType(str, enum.Enum):
    robot = "robot"
    box = "box"
    shelf = "shelf"
    conveyor = "conveyor"
    obstacle = "obstacle"


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    objects: Mapped[list[SceneObject]] = relationship(
        "SceneObject",
        back_populates="scene",
        cascade="all, delete-orphan",
        order_by="SceneObject.created_at",
    )
    events: Mapped[list[EventLog]] = relationship(
        "EventLog",
        back_populates="scene",
        cascade="all, delete-orphan",
        order_by="EventLog.timestamp.desc()",
    )


class SceneObject(Base):
    __tablename__ = "scene_objects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scene_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scenes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[ObjectType] = mapped_column(
        Enum(ObjectType, name="object_type"), nullable=False
    )
    position: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=lambda: {"x": 0, "y": 0, "z": 0}
    )
    rotation: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=lambda: {"x": 0, "y": 0, "z": 0}
    )
    scale: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=lambda: {"x": 1, "y": 1, "z": 1}
    )
    meta: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    scene: Mapped[Scene] = relationship("Scene", back_populates="objects")


class EventLog(Base):
    __tablename__ = "event_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scene_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scenes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    scene: Mapped[Scene] = relationship("Scene", back_populates="events")
