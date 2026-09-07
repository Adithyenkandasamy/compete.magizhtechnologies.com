import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AdminSubmissionResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateAdminSubmissionStatusRequest(BaseModel):
    status: str
