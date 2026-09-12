import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CriterionBreakdown(BaseModel):
    """Average scores across judges for each evaluation criterion."""
    innovation_score: Optional[float] = Field(None, description="Average Innovation & Originality score (0-25)")
    technical_score: Optional[float] = Field(None, description="Average Technical score (0-25)")
    impact_score: Optional[float] = Field(None, description="Average Impact & Value score (0-20)")
    uiux_score: Optional[float] = Field(None, description="Average UI/UX score (0-15)")
    presentation_score: Optional[float] = Field(None, description="Average Presentation score (0-15)")


class EventResultResponse(BaseModel):
    """Public leaderboard entry for a team and project placement."""
    id: uuid.UUID
    event_id: uuid.UUID
    submission_id: uuid.UUID
    project_id: uuid.UUID
    team_id: uuid.UUID
    rank: int = Field(..., description="Official placement rank (1 = Winner)")
    final_score: float = Field(..., description="Overall score averaged across all evaluations")
    scores: CriterionBreakdown = Field(..., description="Detailed criterion score breakdown")
    evaluations_count: int = Field(..., description="Number of judge evaluations averaged")
    award: Optional[str] = Field(None, description="Award or title, e.g. Winner, 1st Runner Up")
    is_winner: bool = Field(False, description="Whether the team is declared the overall winner")
    project_title: Optional[str] = None
    project_description: Optional[str] = None
    team_name: Optional[str] = None
    team_members: list[str] = Field(default_factory=list, description="Public list of team member names")

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    """Event leaderboard containing ranked team placements and publication status."""
    event_id: uuid.UUID
    event_title: str
    results_published: bool
    results_published_at: Optional[datetime] = None
    total_participants: int = 0
    leaderboard: list[EventResultResponse] = Field(default_factory=list)


class AdminEventResultResponse(EventResultResponse):
    """Detailed result entry for administrators with publication flags and internal notes."""
    is_published: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalculateResultsRequest(BaseModel):
    """Admin configuration payload for computing event rankings and scores."""
    publish_immediately: bool = Field(
        False, description="If true, immediately publish results upon calculation"
    )
    auto_assign_awards: bool = Field(
        True, description="Automatically assign Winner, 1st Runner Up, 2nd Runner Up to top 3"
    )


class UpdateResultAwardRequest(BaseModel):
    """Admin payload to customize honors, awards, or add administrative notes."""
    award: Optional[str] = Field(None, max_length=100, description="Custom award title")
    is_winner: Optional[bool] = Field(None, description="Explicit winner toggle")
    notes: Optional[str] = Field(None, description="Internal administrative notes")


class AnonymousJudgeFeedback(BaseModel):
    """Constructive qualitative feedback from judges stripped of judge identity."""
    feedback: str
    created_at: datetime


class StudentTeamResultResponse(BaseModel):
    """Participant view of their team's performance, ranking, and feedback."""
    event_id: uuid.UUID
    event_title: str
    project_id: uuid.UUID
    project_title: str
    team_id: uuid.UUID
    team_name: str
    rank: Optional[int] = None
    final_score: Optional[float] = None
    award: Optional[str] = None
    is_winner: bool = False
    scores: Optional[CriterionBreakdown] = None
    feedbacks: list[AnonymousJudgeFeedback] = Field(default_factory=list)
    results_published: bool
    message: Optional[str] = None
