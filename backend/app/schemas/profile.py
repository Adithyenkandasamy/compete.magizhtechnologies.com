import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    """Schema for updating a user's own student profile."""
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileResponse(BaseModel):
    """Safe schema for returning a user's own profile."""
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    magizh_student_id: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    is_profile_completed: bool = False
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class StudentIdentityResponse(BaseModel):
    """Clean representation of the permanent Magizh Student Identity."""
    model_config = ConfigDict(from_attributes=True)

    magizh_student_id: str = Field(..., description="Permanent student ID, e.g. MAGZ-26-004821")
    full_name: str
    date_of_birth: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    status: str = "ACTIVE STUDENT"
    is_profile_completed: bool = False
    verification_url: str


class ProfilePublicResponse(BaseModel):
    """
    Safe public schema for QR code scanning & student verification.
    Strictly excludes sensitive account data, phone number, and date of birth.
    """
    model_config = ConfigDict(from_attributes=True)

    magizh_student_id: str
    full_name: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    status: str = "ACTIVE STUDENT"
    skills: Optional[list[str]] = None
    bio: Optional[str] = None
    created_at: datetime
    avatar_url: Optional[str] = None
    user_id: Optional[uuid.UUID] = None