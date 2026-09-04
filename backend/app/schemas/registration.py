from datetime import datetime
import uuid

from pydantic import BaseModel

from app.models.enums import EventMode, EventType, RegistrationStatus


class MinimalEventResponse(BaseModel):
    """A minimal version of the Event schema to embed in registration responses."""
    id: uuid.UUID
    title: str
    slug: str
    event_type: EventType
    start_date: datetime | None = None
    end_date: datetime | None = None
    mode: EventMode

    class Config:
        from_attributes = True


class RegistrationResponse(BaseModel):
    """Base schema for a registration."""
    id: uuid.UUID
    status: RegistrationStatus
    registered_at: datetime
    event_id: uuid.UUID

    class Config:
        from_attributes = True


class RegistrationWithEventResponse(RegistrationResponse):
    """Schema for returning a registration with its associated event details."""
    event: MinimalEventResponse

    class Config:
        from_attributes = True
