"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-24

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scenes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    object_type = postgresql.ENUM(
        "robot",
        "box",
        "shelf",
        "conveyor",
        "obstacle",
        name="object_type",
    )
    object_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "scene_objects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "scene_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scenes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "type",
            postgresql.ENUM(name="object_type", create_type=False),
            nullable=False,
        ),
        sa.Column("position", postgresql.JSONB(), nullable=False),
        sa.Column("rotation", postgresql.JSONB(), nullable=False),
        sa.Column("scale", postgresql.JSONB(), nullable=False),
        sa.Column("meta", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "event_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "scene_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scenes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("event_logs")
    op.drop_table("scene_objects")
    op.drop_table("scenes")
    op.execute("DROP TYPE IF EXISTS object_type")
