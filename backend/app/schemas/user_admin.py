import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AccountStatus, UserRole


class UserProfileSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    graduation_year: Optional[int] = None


class UserParticipationStats(BaseModel):
    registrations_count: int = 0
    teams_count: int = 0
    submissions_count: int = 0
    certificates_count: int = 0


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role: UserRole
    status: AccountStatus
    profile: Optional[UserProfileSummary] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    stats: Optional[UserParticipationStats] = None


class UpdateUserStatusRequest(BaseModel):
    status: AccountStatus
    reason: Optional[str] = Field(None, max_length=500, description="Administrative justification")


class UpdateUserRoleRequest(BaseModel):
    role: UserRole
    reason: Optional[str] = Field(None, max_length=500, description="Administrative justification")
