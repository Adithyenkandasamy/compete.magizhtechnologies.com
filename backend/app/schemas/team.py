from datetime import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import JoinRequestStatus, TeamMemberRole
from app.schemas.registration import MinimalEventResponse


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)


class TeamMemberResponse(BaseModel):
    user_id: uuid.UUID
    role: TeamMemberRole
    joined_at: datetime
    
    # We'll embed minimal user info
    full_name: str
    email: str

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: uuid.UUID
    name: str
    event_id: uuid.UUID
    leader_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    member_count: int
    max_members: int
    
    members: list[TeamMemberResponse]

    class Config:
        from_attributes = True


class TeamInviteResponse(BaseModel):
    """
    Response returned when a leader generates or fetches an invite.
    Exposes the raw token ONLY to the leader.
    """
    team_id: uuid.UUID
    token: str
    created_at: datetime


class InviteInfoResponse(BaseModel):
    """
    Publicly safe information returned when resolving a raw invite token.
    """
    team_id: uuid.UUID
    team_name: str
    event: MinimalEventResponse
    member_count: int
    max_members: int
    is_full: bool


class JoinRequestResponse(BaseModel):
    id: uuid.UUID
    team_id: uuid.UUID
    user_id: uuid.UUID
    status: JoinRequestStatus
    requested_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[uuid.UUID]
    
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None

    class Config:
        from_attributes = True
