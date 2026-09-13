import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SecurityAlertSeverity, SecurityAlertStatus


class SecurityAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: str
    severity: SecurityAlertSeverity
    user_id: Optional[uuid.UUID] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    description: str
    status: SecurityAlertStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None


class SecurityAlertUpdate(BaseModel):
    status: SecurityAlertStatus
    notes: Optional[str] = Field(None, max_length=1000, description="Investigation or resolution notes")
