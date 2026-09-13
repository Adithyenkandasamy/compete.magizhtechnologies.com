import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EventStatus, EventType, RegistrationStatus


class RegistrationStudentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class RegistrationEventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    event_type: EventType
    status: EventStatus


class AdminRegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: RegistrationStatus
    registered_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[RegistrationStudentSummary] = None
    event: Optional[RegistrationEventSummary] = None


class UpdateAdminRegistrationRequest(BaseModel):
    status: RegistrationStatus
    reason: Optional[str] = Field(None, max_length=500, description="Reason for status change")
