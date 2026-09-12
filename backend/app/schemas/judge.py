import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class JudgeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Judge's display or full name")
    bio: Optional[str] = Field(None, description="Professional background or biography")
    expertise: Optional[list[str]] = Field(None, description="Domain areas or technologies of expertise")


class JudgeCreate(JudgeBase):
    """Schema for creating a judge from an existing account or email."""
    email: Optional[EmailStr] = Field(None, description="Email of existing or new user")
    user_id: Optional[uuid.UUID] = Field(None, description="ID of existing user")
    password: Optional[str] = Field(None, min_length=8, description="Password if provisioning a new user account")


class JudgeUpdate(BaseModel):
    """Schema for updating judge details."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    bio: Optional[str] = None
    expertise: Optional[list[str]] = None
    is_active: Optional[bool] = None


class JudgeResponse(JudgeBase):
    """Publicly safe judge representation."""
    id: uuid.UUID
    user_id: uuid.UUID
    email: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventJudgeResponse(BaseModel):
    """Event to judge assignment details."""
    event_id: uuid.UUID
    judge_id: uuid.UUID
    assigned_at: datetime
    assigned_by: Optional[uuid.UUID] = None
    judge: Optional[JudgeResponse] = None

    class Config:
        from_attributes = True
