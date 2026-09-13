import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import SubmissionStatus


class AdminProjectTeamSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    leader_name: Optional[str] = None
    member_count: int = 0


class AdminProjectSubmissionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None


class AdminProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    team_name: Optional[str] = None
    event_id: Optional[uuid.UUID] = None
    event_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None
    team: Optional[AdminProjectTeamSummary] = None
    submission: Optional[AdminProjectSubmissionSummary] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
