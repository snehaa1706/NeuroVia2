from fastapi import APIRouter

router = APIRouter()

from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.services.communication.notification_service import send_notification
import os

def _notify_alert(alert_data: dict, user_email: str = None):
    receiver_email = os.getenv("TEST_RECEIVER_EMAIL") or user_email or os.getenv("RESEND_FROM_EMAIL") or "no-reply@neurovia.app"
    receiver_phone = os.getenv("TEST_RECEIVER_PHONE", os.getenv("TWILIO_PHONE_NUMBER"))
    
    alert_msg = alert_data.get("message", "A health alert was triggered.")
    html_content = f"<h2>NeuroVia Alert Notification</h2><p><strong>Alert:</strong> {alert_msg}</p><p>Please check the caregiver dashboard for more details.</p>"
    
    try:
        send_notification(
            email=receiver_email,
            phone=receiver_phone,
            subject="NeuroVia Critical Alert",
            message=f"NeuroVia Alert: {alert_msg}",
            html_content=html_content
        )
    except Exception as e:
        print(f"Error sending notification: {e}")
from app.modules.patient.model import (
    ActivityResponse,
    ActivityResultSubmit,
    ActivityResultResponse,
    FamilyMemberCreate,
    FamilyMemberResponse,
)
from app.modules.patient.service import evaluate_activity_result

router_activities = APIRouter()


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router_activities.get("/")
async def get_activities(request: Request):
    """Get cognitive activities for the user."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    result = (
        sb.table("activities")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    return {"activities": result.data}


@router_activities.post("/{activity_id}/submit", response_model=ActivityResultResponse)
async def submit_activity_result(
    request: Request, activity_id: str, data: ActivityResultSubmit
):
    """Submit activity results and get AI feedback."""
    sb = get_supabase()
    _get_user_id(request)

    # Fetch activity
    activity = (
        sb.table("activities")
        .select("*")
        .eq("id", activity_id)
        .single()
        .execute()
    )
    if not activity.data:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Evaluate result
    score, feedback = evaluate_activity_result(
        activity.data.get("content", {}), data.responses
    )

    record = {
        "activity_id": activity_id,
        "responses": data.responses,
        "score": score,
        "ai_feedback": feedback,
    }
    result = sb.table("activity_results").insert(record).execute()
    activity_result = result.data[0]

    return ActivityResultResponse(
        id=activity_result["id"],
        activity_id=activity_result["activity_id"],
        responses=activity_result["responses"],
        score=activity_result["score"],
        ai_feedback=activity_result.get("ai_feedback"),
        completed_at=activity_result.get("completed_at"),
    )


@router_activities.get("/progress")
async def get_activity_progress(request: Request):
    """Get activity progress and performance trends."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    # Get activities with results
    activities = (
        sb.table("activities")
        .select("*, activity_results(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    # Calculate performance stats
    total_activities = len(activities.data) if activities.data else 0
    completed = 0
    total_score = 0
    scores_over_time = []

    for act in (activities.data or []):
        results = act.get("activity_results", [])
        if results:
            completed += 1
            latest_score = results[-1].get("score", 0)
            total_score += latest_score
            scores_over_time.append(
                {
                    "activity_type": act["activity_type"],
                    "score": latest_score,
                    "date": act["created_at"],
                }
            )

    avg_score = total_score / completed if completed > 0 else 0

    return {
        "total_activities": total_activities,
        "completed": completed,
        "average_score": round(avg_score, 1),
        "scores_over_time": scores_over_time,
    }


@router_activities.post("/family-members", response_model=FamilyMemberResponse)
async def add_family_member(request: Request, data: FamilyMemberCreate):
    """Add a family member for photo recognition activities."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    record = {
        "user_id": user_id,
        "name": data.name,
        "relationship": data.relationship,
        "photo_url": data.photo_url,
    }
    result = sb.table("family_members").insert(record).execute()
    member = result.data[0]

    return FamilyMemberResponse(**member)


@router_activities.get("/family-members")
async def get_family_members(request: Request):
    """Get family members for the user."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    result = (
        sb.table("family_members")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    return {"family_members": result.data}


router.include_router(router_activities, prefix='/activities', tags=['Patient Module'])

from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.modules.patient.model import (
    MedicationCreate,
    MedicationResponse,
    MedicationLogCreate,
    MedicationLogResponse,
)
from app.modules.patient.service import check_medication_alerts

router_medications = APIRouter()


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router_medications.get("/")
async def get_medications(request: Request):
    """Get all medications for the user."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    result = (
        sb.table("medications")
        .select("*")
        .eq("user_id", user_id)
        .eq("active", True)
        .execute()
    )

    return {"medications": result.data}


@router_medications.post("/", response_model=MedicationResponse)
async def add_medication(request: Request, data: MedicationCreate):
    """Add a new medication for a patient."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    record = {
        "user_id": user_id,
        "name": data.name,
        "dosage": data.dosage,
        "frequency": data.frequency,
        "time_slots": data.time_slots,
        "active": True,
    }
    result = sb.table("medications").insert(record).execute()
    med = result.data[0]

    return MedicationResponse(**med)


@router_medications.post("/{medication_id}/log", response_model=MedicationLogResponse)
async def log_medication(
    request: Request, medication_id: str, data: MedicationLogCreate
):
    """Log medication intake (taken, missed, or skipped)."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    # Verify medication exists
    med = (
        sb.table("medications")
        .select("*")
        .eq("id", medication_id)
        .single()
        .execute()
    )
    if not med.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    record = {
        "medication_id": medication_id,
        "status": data.status.value,
        "notes": data.notes,
    }
    result = sb.table("medication_logs").insert(record).execute()
    log = result.data[0]

    # Rule-based alert: check for missed medications
    if data.status.value == "missed":
        missed_logs = (
            sb.table("medication_logs")
            .select("id")
            .eq("medication_id", medication_id)
            .eq("status", "missed")
            .limit(10)
            .execute()
        )
        missed_count = len(missed_logs.data) if missed_logs.data else 0
        alert_data = check_medication_alerts(med.data["user_id"], missed_count)
        if alert_data:
            sb.table("alerts").insert(alert_data).execute()
            _notify_alert(alert_data)

    return MedicationLogResponse(
        id=log["id"],
        medication_id=log["medication_id"],
        taken_at=log.get("taken_at"),
        status=log["status"],
        notes=log.get("notes"),
    )


@router_medications.get("/adherence")
async def get_adherence(request: Request):
    """Get medication adherence statistics for the user."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    # Get all medications for patient
    meds = (
        sb.table("medications")
        .select("id, name")
        .eq("user_id", user_id)
        .execute()
    )

    adherence_data = []
    for med in (meds.data or []):
        logs = (
            sb.table("medication_logs")
            .select("status")
            .eq("medication_id", med["id"])
            .execute()
        )
        total = len(logs.data) if logs.data else 0
        taken = sum(1 for l in (logs.data or []) if l["status"] == "taken")
        rate = (taken / total * 100) if total > 0 else 0

        adherence_data.append(
            {
                "medication_id": med["id"],
                "medication_name": med["name"],
                "total_logs": total,
                "taken": taken,
                "missed": total - taken,
                "adherence_rate": round(rate, 1),
            }
        )

    return {"adherence": adherence_data}


router.include_router(router_medications, prefix='/medications', tags=['Patient Module'])

from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.modules.patient.model import (
    HealthCheckin,
    HealthIncident,
    HealthLogResponse,
    LogType,
)
from app.modules.patient.service import (
    check_confusion_alert,
    check_incident_alert,
)

router_health = APIRouter()


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router_health.post("/checkin", response_model=HealthLogResponse)
async def submit_checkin(request: Request, data: HealthCheckin):
    """Submit a daily patient check-in."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    record = {
        "user_id": user_id,
        "log_type": LogType.daily_checkin.value,
        "mood": data.mood,
        "confusion_level": data.confusion_level,
        "sleep_hours": data.sleep_hours,
        "appetite": data.appetite,
        "notes": data.notes,
    }
    result = sb.table("health_logs").insert(record).execute()
    log = result.data[0]

    # Rule-based alert check for confusion
    alert_data = check_confusion_alert(user_id, data.confusion_level)
    if alert_data:
        sb.table("alerts").insert(alert_data).execute()
        _notify_alert(alert_data)

    return HealthLogResponse(**log)


@router_health.post("/incident", response_model=HealthLogResponse)
async def log_incident(request: Request, data: HealthIncident):
    """Log a patient incident."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    record = {
        "user_id": user_id,
        "log_type": LogType.incident.value,
        "notes": data.description,
    }
    result = sb.table("health_logs").insert(record).execute()
    log = result.data[0]

    # Rule-based alert for incidents
    alert_data = check_incident_alert(user_id, data.description)
    if alert_data:
        sb.table("alerts").insert(alert_data).execute()
        _notify_alert(alert_data)

    return HealthLogResponse(**log)


@router_health.get("/logs")
async def get_patient_logs(request: Request):
    """Get logs for the user."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    result = (
        sb.table("health_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {"logs": result.data}





router.include_router(router_health, prefix='/health', tags=['Patient Module'])

from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.modules.patient.model import AlertResponse

router_alerts = APIRouter()


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router_alerts.get("/")
async def get_alerts(request: Request, unread_only: bool = False):
    """Get alerts for the current user."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    # Get alerts for user
    query = (
        sb.table("alerts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
    )
    if unread_only:
        query = query.eq("read", False)
    
    result = query.execute()
    return {"alerts": result.data or []}


@router_alerts.put("/{alert_id}/read")
async def mark_alert_read(request: Request, alert_id: str):
    """Mark an alert as read."""
    sb = get_supabase()
    _get_user_id(request)

    result = (
        sb.table("alerts")
        .update({"read": True})
        .eq("id", alert_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"message": "Alert marked as read"}


router.include_router(router_alerts, prefix='/alerts', tags=['Patient Module'])