from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional, Any, Dict, List
from enum import Enum
from datetime import datetime


class AssessmentStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class RiskBand(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


class AssessmentResponse(BaseModel):
    id: str
    user_id: str
    current_level: int
    status: AssessmentStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentResponseData(BaseModel):
    id: str
    assessment_id: str
    level: int
    responses: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentResultResponse(BaseModel):
    id: str
    assessment_id: str
    level: int
    raw_scores: Dict[str, Any]
    normalized_scores: Dict[str, float]
    cognitive_score: float
    risk_score: float
    risk_band: RiskBand

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    id: str
    assessment_id: str
    recommendation_text: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- REQUEST INPUT MODELS ---

class MemoryListResponse(BaseModel):
    response: Optional[List[str]] = Field(default=[])
    dont_remember: bool = Field(default=False)

    @model_validator(mode="before")
    def normalize_input(cls, value):
        if isinstance(value, list):
            return {"response": value, "dont_remember": False}
        if isinstance(value, str):
            cleaned = [item.strip() for item in value.split(",") if item.strip()]
            return {"response": cleaned, "dont_remember": False}
        return value

class MemoryStringResponse(BaseModel):
    response: Optional[str] = Field(default="")
    dont_remember: bool = Field(default=False)

    @model_validator(mode="before")
    def normalize_input(cls, value):
        if isinstance(value, (str, int, float)):
            return {"response": str(value), "dont_remember": False}
        return value


class Level1Request(BaseModel):
    ad8_answers: Dict[str, bool] = Field(..., description="Map of AD8 questions to True/False")
    orientation_answers: Dict[str, str] = Field(..., description="String answers for temporal/spatial queries")
    recall_words: MemoryListResponse = Field(..., description="Memory list response object for recall words")


class Level2Request(BaseModel):
    animals: List[str] = Field(default=[], description="Semantic verbal fluency list")
    digit_span_forward: MemoryStringResponse = Field(..., description="User's forward digit span response or dont_remember flag")
    digit_span_backward: MemoryStringResponse = Field(..., description="User's backward digit span response or dont_remember flag")
    visual_recognition_selected: List[str] = Field(default=[], description="IDs of objects selected in recognition test")
    pattern_answer: str = Field(default="", description="User's visual pattern answer (A/B/C/D)")
    delayed_recall: MemoryListResponse = Field(..., description="Word targets recalled after delay or dont_remember flag")


class Level3Request(BaseModel):
    clock_image_url: str = Field(default="", description="Valid Cloud URL for the uploaded drawing. Can be empty if skipped.")
    stroop_responses: List[Dict[str, Any]] = Field(default=[], description="List of Stroop trial responses with answer, reaction_time_ms, timed_out")


from enum import Enum
from typing import Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class TestType(str, Enum):
    __test__ = False
    ad8 = "ad8"
    orientation = "orientation"
    verbal_fluency = "verbal_fluency"
    trail_making = "trail_making"
    clock_drawing = "clock_drawing"
    moca = "moca"
    memory_recall = "memory_recall"
    reaction_time = "reaction_time"
    sequence_memory = "sequence_memory"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# ============================================
# REQUEST SCHEMAS
# ============================================

class SessionStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    test_type: TestType
    difficulty: Difficulty = Difficulty.medium


class TestSubmissionRequest(BaseModel):
    __test__ = False
    model_config = ConfigDict(extra="forbid")
    responses: Dict[str, Any]
    time_taken_seconds: float = Field(..., gt=0, description="Time taken to finish the test in seconds")


# ============================================
# PER-TEST RESPONSE VALIDATION SCHEMAS
# ============================================

class MemoryRecallResponse(BaseModel):
    """Validates the response payload for memory recall tests."""
    model_config = ConfigDict(extra="forbid")
    words: List[str] = Field(..., description="List of recalled words")


class VerbalFluencyResponse(BaseModel):
    """Validates the response payload for verbal fluency tests."""
    model_config = ConfigDict(extra="forbid")
    words: List[str] = Field(..., description="List of generated words for the category")


class ReactionTimeResponse(BaseModel):
    """Validates the response payload for reaction time tests."""
    model_config = ConfigDict(extra="forbid")
    reaction_time_ms: float = Field(..., ge=0, le=10000, description="Reaction time in milliseconds")


class SequenceMemoryResponse(BaseModel):
    """Validates the response payload for sequence memory tests."""
    model_config = ConfigDict(extra="forbid")
    sequence: List[int] = Field(..., description="Recalled sequence of numbers")


# Map test types to their validation schemas
TEST_RESPONSE_SCHEMAS: Dict[str, type] = {
    TestType.memory_recall: MemoryRecallResponse,
    TestType.verbal_fluency: VerbalFluencyResponse,
    TestType.reaction_time: ReactionTimeResponse,
    TestType.sequence_memory: SequenceMemoryResponse,
}


# ============================================
# RESPONSE SCHEMAS
# ============================================

class CognitiveSessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    test_type: TestType
    difficulty: Difficulty
    status: str
    test_config: Dict[str, Any]


class CognitiveResultResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    test_type: TestType
    score: float
    score_components: Dict[str, Any] = Field(default_factory=dict)
    time_taken_seconds: float
    created_at: datetime


class CognitiveSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    avg_score: float | None = None
    latest_score: float | None = None
    trend: str  # "no_data" | "improving" | "stable" | "declining"
    recent_scores: List[float] = Field(default_factory=list)
    recent_results: List[Dict[str, Any]] = Field(default_factory=list)
