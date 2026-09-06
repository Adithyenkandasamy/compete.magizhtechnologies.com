from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field, HttpUrl


class SponsorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Sponsor name")
    logo_url: Optional[HttpUrl] = Field(None, description="URL to the sponsor logo")
    website_url: Optional[HttpUrl] = Field(None, description="URL to the sponsor website")


class SponsorCreate(SponsorBase):
    pass


class SponsorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    logo_url: Optional[HttpUrl] = None
    website_url: Optional[HttpUrl] = None


class SponsorResponse(SponsorBase):
    id: uuid.UUID
    event_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True