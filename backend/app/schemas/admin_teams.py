import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import SubmissionStatus, TeamMemberRole


class AdminTeamMemberItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: TeamMemberRole
    joined_at: datetime


class AdminTeamProjectSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    submission_id: Optional[uuid.UUID] = None
    submission_status: Optional[SubmissionStatus] = None


class AdminTeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    event_title: Optional[str] = None
    name: str
    leader_id: uuid.UUID
    leader_name: Optional[str] = None
    leader_email: Optional[str] = None
    member_count: int = 0
    members: list[AdminTeamMemberItem] = []
    project: Optional[AdminTeamProjectSummary] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
