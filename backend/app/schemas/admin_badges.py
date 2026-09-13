import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class AdminBadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    icon: str
    created_at: datetime
    awarded_count: int = 0


class AdminBadgeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=3, max_length=500)
    icon: str = Field(..., min_length=1, max_length=2048)


class AdminBadgeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=3, max_length=500)
    icon: Optional[str] = Field(None, min_length=1, max_length=2048)


class AwardBadgeRequest(BaseModel):
    user_id: uuid.UUID
