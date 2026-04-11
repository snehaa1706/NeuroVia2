from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class PatientSummary(BaseModel):
    id: str
    full_name: str
    email: str

class PatientDashboard(BaseModel):
    patient: PatientSummary
    latest_report: Optional[Dict[str, Any]] = None
    history: List[Dict[str, Any]] = []
    activities: List[Dict[str, Any]] = []
    domain_scores: Dict[str, float] = {}

class DoctorProfile(BaseModel):
    user_id: str
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    available: bool = True

class ConsultationRequestBase(BaseModel):
    patient_id: str
    screening_id: Optional[str] = None
    risk_level: str
    summary: Optional[str] = None
    key_concerns: Optional[List[str]] = None

class ConsultationResponse(BaseModel):
    diagnosis: str
    notes: Optional[str] = None
    prescription: Optional[List[str]] = None
    prescription_text: Optional[str] = None
    vitals: Optional[Dict[str, str]] = None
    attachments: Optional[List[str]] = None
    follow_up_date: Optional[str] = None

class ConsultationDetail(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    screening_id: Optional[str] = None
    status: str  # pending, accepted, completed
    created_at: datetime
    patient: PatientSummary
    request_data: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
