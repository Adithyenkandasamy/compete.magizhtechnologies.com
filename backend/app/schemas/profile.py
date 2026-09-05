import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProfileUpdate(BaseModel):
    """Schema for updating a user's own profile."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    phone: Optional[str] = None


class ProfileResponse(BaseModel):
    """Safe schema for returning a user's own profile."""
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime