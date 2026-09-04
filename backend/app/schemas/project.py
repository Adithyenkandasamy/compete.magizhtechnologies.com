from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field, HttpUrl


class ProjectBase(BaseModel):
    title: str = Field(..., max_length=255, description="The title of the project")
    description: Optional[str] = Field(None, description="Detailed description of the project")
    problem: Optional[str] = Field(None, description="The problem the project solves")
    solution: Optional[str] = Field(None, description="The proposed solution")
    tech_stack: Optional[list[str]] = Field(None, description="List of technologies used")
    github_url: Optional[HttpUrl] = Field(None, description="URL to the GitHub repository")
    demo_url: Optional[HttpUrl] = Field(None, description="URL to the live demo")
    video_url: Optional[HttpUrl] = Field(None, description="URL to a demonstration video")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    tech_stack: Optional[list[str]] = None
    github_url: Optional[HttpUrl] = None
    demo_url: Optional[HttpUrl] = None
    video_url: Optional[HttpUrl] = None


class ProjectResponse(ProjectBase):
    id: uuid.UUID
    team_id: uuid.UUID
    event_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
