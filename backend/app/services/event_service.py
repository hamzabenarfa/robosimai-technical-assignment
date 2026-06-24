from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models import EventLog


def log_event(
    db: Session,
    *,
    scene_id: uuid.UUID,
    action: str,
    payload: dict | None = None,
) -> EventLog:
    """Insert an EventLog row. Caller is responsible for the surrounding transaction."""
    event = EventLog(scene_id=scene_id, action=action, payload=payload or {})
    db.add(event)
    return event
