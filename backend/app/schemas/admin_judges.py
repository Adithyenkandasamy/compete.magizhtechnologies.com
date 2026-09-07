import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AdminJudgeResponse(BaseModel):
    id: uuid.UUID
    name: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateAdminJudgeRequest(BaseModel):
    name: str
    email: str


class UpdateAdminJudgeRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
