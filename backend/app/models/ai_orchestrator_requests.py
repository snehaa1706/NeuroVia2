from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class RiskPredictionRequest(BaseModel):
    patient_metrics: Dict[str, Any]


class TrendAnalysisRequest(BaseModel):
    wellness_history: List[Dict[str, Any]]


class SemanticValidationRequest(BaseModel):
    words: List[str]
    category: str = "animals"


class ClockAnalysisRequest(BaseModel):
    image_b64: str


class DoctorInsightRequest(BaseModel):
    risk: Dict[str, Any]
    trend: Dict[str, Any]
    semantic: Dict[str, Any]
    clock: Dict[str, Any]


class FullAnalysisRequest(BaseModel):
    patient_metrics: Dict[str, Any] = {}
    wellness_history: List[Dict[str, Any]] = []
    semantic_words: List[str] = []
    semantic_category: str = "animals"
    clock_image_b64: str = ""
