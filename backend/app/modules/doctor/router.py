from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
from uuid import uuid4
import os
import shutil
from app.database import get_supabase
from .model import (
    DoctorProfile, 
    ConsultationRequestBase, 
    ConsultationResponse, 
    ConsultationDetail,
    PatientDashboard
)
from app.services.supabase_service import SupabaseIntegrationService
import json

router = APIRouter()

WORKING_HOURS_FILE = os.path.join(os.path.dirname(__file__), "working_hours_db.json")

def load_working_hours():
    try:
        if os.path.exists(WORKING_HOURS_FILE):
            with open(WORKING_HOURS_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_working_hours(data):
    try:
        with open(WORKING_HOURS_FILE, "w") as f:
            json.dump(data, f)
    except Exception:
        pass

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/list")
async def list_doctors():
    """
    Public endpoint: returns all registered doctors.
    No auth required — patients need to browse before booking.
    """
    sb = get_supabase()
    result = (
        sb.table("users")
        .select("id, email, full_name, phone, avatar_url, specialty, bio, location, experience, gender, created_at")
        .eq("role", "doctor")
        .execute()
    )
    return result.data or []

@router.get("/{id}/slots")
async def get_doctor_slots(id: str, date: str):
    """
    Returns available 1-hour time slots for a doctor on a specific ISO date (YYYY-MM-DD).
    """
    from datetime import datetime
    sb = get_supabase()
    
    # Check doctor working hours
    wh = None
    try:
        wh_db = load_working_hours()
        if id in wh_db:
            wh = wh_db[id]
        else:
            doc = sb.table("users").select("working_hours").eq("id", id).execute()
            if doc.data and doc.data[0].get("working_hours"):
                wh = doc.data[0]["working_hours"]
    except Exception:
        pass
        
    if not wh:
        wh = {"mon_fri": "09:00-17:00", "sat": "10:00-14:00", "sun": "10:00-14:00"}
    
    dt = datetime.strptime(date, "%Y-%m-%d")
    weekday = dt.weekday()
    
    valid_range = None
    if weekday <= 4 and "mon_fri" in wh:
        valid_range = wh["mon_fri"]
    elif weekday == 5 and "sat" in wh:
        valid_range = wh["sat"]
    elif weekday == 6 and "sun" in wh:
        valid_range = wh["sun"]
        
    if not valid_range:
        return []
        
    start_str, end_str = valid_range.split("-")
    start_hour = int(start_str.split(":")[0])
    end_hour = int(end_str.split(":")[0])
    
    # Generate 1-hour slots
    all_slots = []
    for h in range(start_hour, end_hour):
        slot_time = f"{date}T{h:02d}:00"
        all_slots.append(slot_time)
        
    # Find existing bookings
    consults = sb.table("consultations").select("time_slot, status").eq("doctor_id", id).execute()
    booked_slots = set()
    if consults.data:
        for c in consults.data:
            ts = c.get("time_slot")
            if ts and c.get("status") in ("pending", "accepted", "completed"):
                normalized = ts.replace("Z", "").replace("+00:00", "")[:16]
                booked_slots.add(normalized)
                
    available = [s for s in all_slots if s[:16] not in booked_slots]
    return available


# Dependency to get current user role and verify it's a doctor
async def get_doctor_service(request: Request):
    """
    Dependency that extracts user from token and ensures they are a doctor.
    """
    # Simulate extraction from token (in a real app, this would be a verified JWT)
    # The SupabaseIntegrationService should already be initialized with the user context.
    # For now, we'll assume the user is passed in correctly.
    # We should normally use security.py but we'll adapt for this specific task.
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if the user has the doctor role
    user_result = sb.table("users").select("role").eq("id", user_response.user.id).single().execute()
    if not user_result.data or user_result.data["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Access denied: Doctor role required.")
    
    return SupabaseIntegrationService({"id": user_response.user.id})

@router.put("/me")
async def update_doctor_profile(request: Request, service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    Allow a doctor to update their own profile, including working hours.
    """
    sb = get_supabase()
    body = await request.json()
    
    wh = body.pop("working_hours", None)
    if wh:
        wh_db = load_working_hours()
        wh_db[service.user_id] = wh
        save_working_hours(wh_db)

    result_data = None
    if body:
        try:
            result = sb.table("users").update(body).eq("id", service.user_id).execute()
            if result.data:
                result_data = result.data[0]
        except Exception:
            pass
            
    if not result_data:
        try:
            res = sb.table("users").select("*").eq("id", service.user_id).execute()
            result_data = res.data[0] if res.data else {}
        except Exception:
            result_data = {}
            
    if wh:
        result_data["working_hours"] = wh
        
    return {"status": "success", "data": result_data}

@router.get("/consult/stats")
async def get_doctor_stats(service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    Returns doctor-specific statistics.
    """
    from datetime import datetime
    sb = get_supabase()
    
    assigned = sb.table("consultations").select("*").eq("doctor_id", service.user_id).execute().data or []
    unassigned_pending = sb.table("consultations").select("*").is_("doctor_id", "null").eq("status", "pending").execute().data or []
    
    all_consults = assigned + unassigned_pending
    seen_ids = set()
    unique_consults = []
    for c in all_consults:
        if c["id"] not in seen_ids:
            seen_ids.add(c["id"])
            unique_consults.append(c)
            
    pending = sum(1 for c in unique_consults if c["status"] == "pending")
    accepted = sum(1 for c in unique_consults if c["status"] == "accepted")
    completed = sum(1 for c in unique_consults if c["status"] == "completed")
    cancelled = sum(1 for c in unique_consults if c["status"] == "cancelled")

    durations = []
    for c in unique_consults:
        if c["status"] == "completed" and "created_at" in c and "updated_at" in c:
            try:
                # Handle "Z" suffix if present
                created_str = c["created_at"].replace("Z", "+00:00")
                updated_str = c["updated_at"].replace("Z", "+00:00")
                created = datetime.fromisoformat(created_str)
                updated = datetime.fromisoformat(updated_str)
                durations.append((updated - created).total_seconds() / 3600)
            except Exception:
                pass

    avg_time = round(sum(durations) / len(durations), 2) if durations else 0

    return {
        "pending": pending,
        "accepted": accepted,
        "completed": completed,
        "total": pending + accepted + completed + cancelled,
        "avg_time": avg_time
    }

@router.get("/consult/requests")
async def get_consultation_requests(service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    List all consultation requests assigned to or available to this doctor.
    """
    sb = get_supabase()

    # Get consultations assigned to this doctor
    assigned = sb.table("consultations").select("*").eq("doctor_id", service.user_id).execute()

    # Get all pending consultations (unassigned ones have doctor_id = None)
    pending = sb.table("consultations").select("*").eq("status", "pending").execute()

    # Merge & deduplicate
    seen_ids = set()
    all_consultations = []
    for c in (assigned.data or []) + (pending.data or []):
        if c["id"] not in seen_ids:
            seen_ids.add(c["id"])
            # Enrich with patient data from metadata or users table
            patient_id = c.get("patient_id")
            metadata = c.get("metadata") or {}
            patient_info = {"full_name": metadata.get("patient_name", "Unknown Patient"), "email": ""}

            if patient_id:
                try:
                    user_result = sb.table("users").select("*").eq("id", patient_id).single().execute()
                    if user_result.data:
                        patient_info = {"id": user_result.data["id"], "full_name": user_result.data["full_name"], "email": user_result.data.get("email", "")}
                except Exception:
                    pass

            c["patient"] = patient_info
            all_consultations.append(c)

    return all_consultations

@router.get("/patients/{id}/dashboard", response_model=PatientDashboard)
async def get_patient_data(id: str, service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    Comprehensive dashboard view for a doctor to review a patient's history.
    """
    # The service.get_patient_dashboard method already performs security checks
    try:
        return service.get_patient_dashboard(id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/consult/requests/{id}/respond")
async def respond_to_consultation(id: str, response: ConsultationResponse, service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    Doctors use this to submit their diagnosis and move the consultation to completed.
    SECURITY: Only allows if doctor_id = current_user OR doctor_id IS NULL.
    If NULL, assigns the current doctor before completing.
    """
    from datetime import datetime
    sb = get_supabase()

    # First, verify the consultation exists and check ownership
    consult_result = sb.table("consultations").select("*").eq("id", id).execute()
    if not consult_result.data:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    consult = consult_result.data[0]

    # Block if already completed or cancelled
    if consult.get("status") in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot modify a {consult['status']} consultation.")

    # Security check: only assigned doctor or unassigned can respond
    existing_doctor_id = consult.get("doctor_id")
    if existing_doctor_id and existing_doctor_id != service.user_id:
        raise HTTPException(status_code=403, detail="This consultation is assigned to another doctor.")

    update_data = {
        "status": "completed",
        "doctor_id": service.user_id,  # Assign if was NULL, or keep same
        "response_data": response.model_dump(),
        "updated_at": datetime.utcnow().isoformat()
    }

    result = sb.table("consultations").update(update_data).eq("id", id).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update consultation record.")

    # Email Notification
    patient_id = result.data[0].get("patient_id")
    patient_data = sb.table("users").select("email").eq("id", patient_id).execute()
    patient_email = patient_data.data[0].get("email") if patient_data.data else "patient@neurovia.com"

    print(f"[EMAIL] SEND_EMAIL: To={patient_email} | Subject='Your Consultation Report' | Body='Your specialized prescription is ready in the NeuroVia dashboard.'")

    return {"status": "success", "data": result.data[0]}

@router.patch("/consult/requests/{id}/status")
async def update_consultation_status(id: str, status: str, service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    Claim or change status of a consultation.
    Validates that finalized consultations cannot be modified.
    """
    from datetime import datetime
    sb = get_supabase()

    # Fetch current consultation to validate
    consult_result = sb.table("consultations").select("status, doctor_id").eq("id", id).execute()
    if not consult_result.data:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    current = consult_result.data[0]

    # Block modifications to finalized consultations
    if current.get("status") in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot modify a {current['status']} consultation.")

    # Block cancellation by a different doctor
    existing_doctor = current.get("doctor_id")
    if existing_doctor and existing_doctor != service.user_id:
        raise HTTPException(status_code=403, detail="This consultation is assigned to another doctor.")

    result = sb.table("consultations").update({
        "status": status,
        "doctor_id": service.user_id,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", id).execute()
    return result.data[0] if result.data else {}


@router.get("/patients")
async def get_doctor_patients(service: SupabaseIntegrationService = Depends(get_doctor_service)):
    """
    Returns a list of unique patients this doctor has interacted with via consultations.
    """
    sb = get_supabase()

    # Get all consultations for this doctor
    assigned = sb.table("consultations").select("*").eq("doctor_id", service.user_id).execute()
    unassigned = sb.table("consultations").select("*").is_("doctor_id", "null").eq("status", "pending").execute()

    all_consults = (assigned.data or []) + (unassigned.data or [])

    # Extract unique patients
    seen_ids = set()
    patients = []
    for c in all_consults:
        pid = c.get("patient_id")
        if not pid or pid in seen_ids:
            continue
        seen_ids.add(pid)

        # Fetch patient info
        try:
            user_result = sb.table("users").select("id, full_name, email, phone, avatar_url, created_at").eq("id", pid).single().execute()
            if user_result.data:
                patient_data = user_result.data
                # Count consultations for this patient
                patient_consults = [x for x in all_consults if x.get("patient_id") == pid]
                latest = max(patient_consults, key=lambda x: x.get("created_at", ""), default=None)
                patient_data["consultation_count"] = len(patient_consults)
                patient_data["latest_consultation"] = latest.get("created_at") if latest else None
                patient_data["latest_status"] = latest.get("status") if latest else None
                patients.append(patient_data)
        except Exception:
            # If user not found, create minimal entry from metadata
            metadata = c.get("metadata") or {}
            patients.append({
                "id": pid,
                "full_name": metadata.get("patient_name", "Unknown Patient"),
                "email": "",
                "consultation_count": 1,
                "latest_consultation": c.get("created_at"),
                "latest_status": c.get("status")
            })

    return patients


# ===== PATIENT-ACCESSIBLE ENDPOINTS (no doctor auth required) =====

@router.post("/consult/patient/book")
async def patient_book_consultation(request: Request):
    """
    Patient submits a consultation request.
    """
    from datetime import datetime
    sb = get_supabase()
    body = await request.json()
    time_slot = body.get("time_slot")
    doctor_id = body.get("doctor_id")

    # Time slot validation
    if time_slot and doctor_id:
        wh = None
        try:
            wh_db = load_working_hours()
            if doctor_id in wh_db:
                wh = wh_db[doctor_id]
            else:
                doc = sb.table("users").select("working_hours").eq("id", doctor_id).execute()
                if doc.data and len(doc.data) > 0:
                    wh = doc.data[0].get("working_hours")
        except Exception:
            pass
            
        if wh:
            try:
                dt = datetime.fromisoformat(time_slot.replace('Z', '+00:00'))
                weekday = dt.weekday()
                time_str = dt.strftime("%H:%M")
                valid = False
                
                if weekday <= 4 and "mon_fri" in wh:
                    start, end = wh["mon_fri"].split("-")
                    if start <= time_str <= end:
                        valid = True
                elif weekday == 5 and "sat" in wh:
                    start, end = wh["sat"].split("-")
                    if start <= time_str <= end:
                        valid = True
                elif weekday == 6 and "sun" in wh:
                    start, end = wh["sun"].split("-")
                    if start <= time_str <= end:
                        valid = True
                        
                if not valid:
                    raise HTTPException(status_code=400, detail="Selected time outside doctor availability")

                # Check concurrency
                normalized = time_slot.replace("Z", "").replace("+00:00", "")[:16]
                consults = sb.table("consultations").select("time_slot, status").eq("doctor_id", doctor_id).execute()
                if consults.data:
                    for c in consults.data:
                        ts = c.get("time_slot")
                        if ts and c.get("status") in ("pending", "accepted", "completed"):
                            c_norm = ts.replace("Z", "").replace("+00:00", "")[:16]
                            if c_norm == normalized:
                                raise HTTPException(status_code=409, detail="Time slot already booked")

            except (ValueError, AttributeError):
                pass

    now_iso = datetime.utcnow().isoformat()
    consultation = {
        "id": str(uuid4()),
        "patient_id": body.get("patient_id"),
        "doctor_id": doctor_id,
        "screening_id": body.get("screening_id"),
        "status": body.get("status", "pending"),
        "metadata": body.get("metadata", {}),
        "time_slot": time_slot,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    result = sb.table("consultations").insert(consultation).execute()
    return {"status": "success", "data": result.data[0] if result.data else consultation}



@router.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """
    Upload a profile image. Returns the URL to access it.
    Stores files in backend/uploads/ directory.
    """
    # Validate file type
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed.")

    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return the URL that will serve this file
    return {"url": f"/uploads/{filename}", "filename": filename}
