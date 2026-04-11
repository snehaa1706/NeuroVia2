from pydantic import BaseModel
from typing import Optional, Any
from enum import Enum
from datetime import datetime


class ActivityType(str, Enum):
    photo_recognition = "photo_recognition"
    memory_recall = "memory_recall"
    verbal_recall = "verbal_recall"
    object_matching = "object_matching"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    activity_type: ActivityType
    content: dict[str, Any]
    difficulty: Difficulty
    created_at: Optional[datetime] = None


class ActivityResultSubmit(BaseModel):
    responses: dict[str, Any]


class ActivityResultResponse(BaseModel):
    id: str
    activity_id: str
    responses: dict[str, Any]
    score: float
    ai_feedback: Optional[str] = None
    completed_at: Optional[datetime] = None


class FamilyMemberCreate(BaseModel):
    name: str
    relationship: str
    photo_url: Optional[str] = None


class FamilyMemberResponse(BaseModel):
    id: str
    user_id: str
    name: str
    relationship: str
    photo_url: Optional[str] = None


from pydantic import BaseModel
from typing import Optional, Any
from enum import Enum
from datetime import datetime


class MedicationStatus(str, Enum):
    taken = "taken"
    missed = "missed"
    skipped = "skipped"


class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    time_slots: list[str]  # e.g. ["08:00", "20:00"]


class MedicationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    dosage: str
    frequency: str
    time_slots: list[str]
    active: bool = True


class MedicationLogCreate(BaseModel):
    status: MedicationStatus
    notes: Optional[str] = None


class MedicationLogResponse(BaseModel):
    id: str
    medication_id: str
    taken_at: Optional[datetime] = None
    status: MedicationStatus
    notes: Optional[str] = None


from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class LogType(str, Enum):
    daily_checkin = "daily_checkin"
    incident = "incident"
    observation = "observation"


class HealthCheckin(BaseModel):
    mood: str
    confusion_level: int  # 1-10
    sleep_hours: float
    appetite: str  # poor, normal, good
    notes: Optional[str] = None


class HealthIncident(BaseModel):
    description: str
    severity: Optional[str] = "moderate"
    notes: Optional[str] = None


class HealthLogResponse(BaseModel):
    id: str
    user_id: str
    log_type: LogType
    mood: Optional[str] = None
    confusion_level: Optional[int] = None
    sleep_hours: Optional[float] = None
    appetite: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class AlertType(str, Enum):
    medication_missed = "medication_missed"
    confusion_spike = "confusion_spike"
    score_decline = "score_decline"
    incident = "incident"


class AlertSeverity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertResponse(BaseModel):
    id: str
    user_id: str
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    ai_interpretation: Optional[str] = None
    read: bool = False
    created_at: Optional[datetime] = None
