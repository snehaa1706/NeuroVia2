from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class RiskLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


class AIAnalysisRequest(BaseModel):
    screening_id: str


class AIAnalysisResponse(BaseModel):
    id: str
    screening_id: str
    risk_level: RiskLevel
    risk_score: float
    interpretation: str
    recommendations: list[str]
    created_at: Optional[datetime] = None


class ActivityGenerationRequest(BaseModel):
    user_id: Optional[str] = None
    activity_type: Optional[str] = None
    difficulty: Optional[str] = "easy"


class HealthGuidanceRequest(BaseModel):
    health_log_id: str
    user_id: str


class HealthGuidanceResponse(BaseModel):
    assessment: str
    care_strategies: list[str]
    warning_signs: list[str]
    suggested_activities: list[str]


class ConsultationSummaryRequest(BaseModel):
    user_id: str
    screening_id: str


class ConsultationSummaryResponse(BaseModel):
    summary: str
    key_symptoms: list[str]
    cognitive_scores: dict
    suggested_diagnostics: list[str]
    questions_for_doctor: list[str]
