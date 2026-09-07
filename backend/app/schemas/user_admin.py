import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateUserStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|SUSPENDED|DELETED)$")


class UpdateUserRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(STUDENT|ADMIN|SUPER_ADMIN)$")
