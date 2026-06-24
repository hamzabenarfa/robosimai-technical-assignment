from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EventLog
from app.schemas import EventLogRead
from app.services.scene_service import get_scene

router = APIRouter(prefix="/api/scenes/{scene_id}/events", tags=["events"])


@router.get("", response_model=list[EventLogRead])
def list_events(
    scene_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[EventLogRead]:
    get_scene(db, scene_id)  # 404 if missing
    stmt = (
        select(EventLog)
        .where(EventLog.scene_id == scene_id)
        .order_by(EventLog.timestamp.desc())
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()
    return [EventLogRead.model_validate(row) for row in rows]
