import uuid
from datetime import datetime
from pydantic import BaseModel

class AdminRegistrationResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UpdateAdminRegistrationRequest(BaseModel):
    status: str
