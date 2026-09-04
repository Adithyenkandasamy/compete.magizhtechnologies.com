from datetime import datetime
from typing import Generic, Optional, TypeVar
import uuid

from pydantic import BaseModel, Field, model_validator

from app.models.enums import EventMode, EventStatus, EventType

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic pagination response wrapper."""
    items: list[T]
    total: int
    page: int
    size: int
    pages: int


class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    event_type: EventType
    banner_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    location: Optional[str] = None
    mode: EventMode = EventMode.ONLINE
    max_participants: Optional[int] = Field(None, gt=0)
    team_size_min: Optional[int] = Field(None, gt=0)
    team_size_max: Optional[int] = Field(None, gt=0)
    prize_pool: Optional[float] = Field(None, ge=0)
    rules: Optional[str] = None


class EventCreate(EventBase):
    @model_validator(mode="after")
    def validate_dates_and_sizes(self) -> "EventCreate":
        # Date validations
        if self.start_date and self.end_date:
            if self.start_date > self.end_date:
                raise ValueError("end_date must not be before start_date")
        
        if self.registration_deadline and self.start_date:
            if self.registration_deadline > self.start_date:
                raise ValueError("registration_deadline must not be after start_date")

        # Team size validations
        if self.team_size_min and self.team_size_max:
            if self.team_size_min > self.team_size_max:
                raise ValueError("team_size_min must not exceed team_size_max")

        return self


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    slug: Optional[str] = Field(None, min_length=3, max_length=255, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    banner_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    location: Optional[str] = None
    mode: Optional[EventMode] = None
    max_participants: Optional[int] = Field(None, gt=0)
    team_size_min: Optional[int] = Field(None, gt=0)
    team_size_max: Optional[int] = Field(None, gt=0)
    prize_pool: Optional[float] = Field(None, ge=0)
    rules: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates_and_sizes(self) -> "EventUpdate":
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("end_date must not be before start_date")
        
        if self.registration_deadline and self.start_date and self.registration_deadline > self.start_date:
            raise ValueError("registration_deadline must not be after start_date")

        if self.team_size_min and self.team_size_max and self.team_size_min > self.team_size_max:
            raise ValueError("team_size_min must not exceed team_size_max")

        return self


class EventPublicResponse(EventBase):
    """Public information for students/guests."""
    id: uuid.UUID
    status: EventStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventAdminResponse(EventPublicResponse):
    """Admin-only information, identical to public for now but separated for future extensibility."""
    pass
