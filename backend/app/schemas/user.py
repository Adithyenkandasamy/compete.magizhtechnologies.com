from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    skills: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    is_verified: bool
    xp_points: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class RegisterRequest(UserCreate):
    pass

class RegisterResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
