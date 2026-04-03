from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.models.health_log import (
    HealthCheckin,
    HealthIncident,
    HealthLogResponse,
    LogType,
)
from app.services.alert_service import (
    check_confusion_alert,
    check_incident_alert,
)

router = APIRouter()


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router.post("/checkin", response_model=HealthLogResponse)
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

    return HealthLogResponse(**log)


@router.post("/incident", response_model=HealthLogResponse)
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

    return HealthLogResponse(**log)


@router.get("/logs")
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



