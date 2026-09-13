from datetime import datetime, timezone
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict


class UserSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    last_seen: Optional[datetime] = None
    expires_at: datetime
    is_active: bool
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AdminSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    last_seen: Optional[datetime] = None
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool
