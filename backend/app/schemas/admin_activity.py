import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminActivityItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    action: str
    event_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    created_at: datetime
