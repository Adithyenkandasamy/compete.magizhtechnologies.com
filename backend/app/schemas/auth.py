from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters long")
    full_name: str = Field(min_length=2, max_length=255)


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for returning JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    refresh_expires_in: Optional[int] = None


class RefreshRequest(BaseModel):
    """Schema for refreshing an access token using a refresh token."""
    refresh_token: str


class ProfileResponse(BaseModel):
    """Schema for embedded profile data in UserResponse."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """Safe schema for returning user data (never includes password hash)."""
    id: uuid.UUID
    email: EmailStr
    role: str
    status: str
    created_at: datetime
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True
