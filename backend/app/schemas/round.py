from datetime import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import EventMode, RoundStatus, RoundType


class EventRoundBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    round_type: RoundType
    order: int = Field(1, ge=1)
    description: Optional[str] = None
    criteria_url: Optional[str] = None
    duration_hours: Optional[int] = Field(None, gt=0)
    mode: Optional[EventMode] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class EventRoundCreate(EventRoundBase):
    pass


class EventRoundUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    round_type: Optional[RoundType] = None
    order: Optional[int] = Field(None, ge=1)
    description: Optional[str] = None
    criteria_url: Optional[str] = None
    duration_hours: Optional[int] = Field(None, gt=0)
    mode: Optional[EventMode] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    status: Optional[RoundStatus] = None


class EventRoundResponse(EventRoundBase):
    id: uuid.UUID
    event_id: uuid.UUID
    status: RoundStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True