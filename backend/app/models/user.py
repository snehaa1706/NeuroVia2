from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import date, datetime


class UserRole(str, Enum):
    patient = "patient"
    caregiver = "caregiver"
    doctor = "doctor"


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.patient
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
    remember_me: bool = False


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
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserProfile
