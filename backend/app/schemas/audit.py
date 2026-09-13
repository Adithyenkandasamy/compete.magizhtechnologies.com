from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict


class AdminAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    actor_email: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    event_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    status_code: Optional[int] = None
    request_id: Optional[str] = None
    created_at: datetime
