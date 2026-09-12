import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import EventStatus, SubmissionStatus, TeamMemberRole


class SubmissionCreate(BaseModel):
    """Schema for initializing a project's submission."""
    pass


class SubmissionUpdate(BaseModel):
    """Schema for updating a draft submission."""
    pass


class SubmissionStatusUpdate(BaseModel):
    """Schema for admin updating submission review status."""
    status: SubmissionStatus = Field(..., description="Target submission review status")


class MinimalProjectResponse(BaseModel):
    """Safe project representation for submission responses."""
    id: uuid.UUID
    team_id: uuid.UUID
    event_id: uuid.UUID
    title: str
    description: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    tech_stack: Optional[list[str]] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None

    class Config:
        from_attributes = True


class MinimalTeamMemberResponse(BaseModel):
    """Safe team member representation excluding sensitive user secrets."""
    user_id: uuid.UUID
    role: TeamMemberRole
    full_name: str
    email: str

    class Config:
        from_attributes = True


class MinimalTeamResponse(BaseModel):
    """Safe team representation for admin submission view."""
    id: uuid.UUID
    name: str
    leader_id: uuid.UUID
    member_count: int
    members: list[MinimalTeamMemberResponse] = []

    class Config:
        from_attributes = True


class MinimalEventResponse(BaseModel):
    """Safe event representation for submission responses."""
    id: uuid.UUID
    title: str
    slug: str
    status: EventStatus

    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    """Standard submission response for student endpoints."""
    id: uuid.UUID
    project_id: uuid.UUID
    event_id: uuid.UUID
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminSubmissionResponse(BaseModel):
    """Enriched submission response for admin endpoints with eager-loaded relations."""
    id: uuid.UUID
    project_id: uuid.UUID
    event_id: uuid.UUID
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    project: Optional[MinimalProjectResponse] = None
    team: Optional[MinimalTeamResponse] = None
    event: Optional[MinimalEventResponse] = None

    class Config:
        from_attributes = True
