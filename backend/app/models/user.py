from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import date, datetime


class UserRole(str, Enum):
    user = "user"
    doctor = "doctor"
    admin = "admin"
    patient = "patient"


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.user
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    experience: Optional[str] = None
    gender: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    avatar_url: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    gender: Optional[str] = None
    created_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    avatar_url: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    gender: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
