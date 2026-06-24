"""add thumbnail column to scenes

Revision ID: 0002_add_scene_thumbnail
Revises: 0001_initial
Create Date: 2026-06-24

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_scene_thumbnail"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scenes", sa.Column("thumbnail", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("scenes", "thumbnail")
