"""
NeuroVia Notification API Endpoints
POST /notify/email  — Send email only
POST /notify/sms    — Send SMS only
POST /notify/all    — Send both
POST /notify/test   — Fire demo test for both channels
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.communication.notification_service import send_notification

router = APIRouter(prefix="/notify", tags=["Notifications"])


class EmailRequest(BaseModel):
    to_email: str
    subject: str = "NeuroVia Notification"
    message: str
    html_content: Optional[str] = None


class SMSRequest(BaseModel):
    to_number: str
    message: str


class NotifyAllRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    subject: str = "NeuroVia Notification"
    message: str
    html_content: Optional[str] = None


@router.post("/email")
async def send_email_endpoint(req: EmailRequest):
    """Send an email notification."""
    result = send_notification(
        email=req.to_email,
        subject=req.subject,
        message=req.message,
        html_content=req.html_content,
    )
    return {"status": "ok", "result": result}


@router.post("/sms")
async def send_sms_endpoint(req: SMSRequest):
    """Send an SMS notification."""
    result = send_notification(
        phone=req.to_number,
        message=req.message,
    )
    return {"status": "ok", "result": result}


@router.post("/all")
async def send_all_endpoint(req: NotifyAllRequest):
    """Send notification via email AND SMS."""
    if not req.email and not req.phone:
        raise HTTPException(status_code=400, detail="Provide at least one of email or phone.")
    result = send_notification(
        email=req.email,
        phone=req.phone,
        subject=req.subject,
        message=req.message,
        html_content=req.html_content,
    )
    return {"status": "ok", "result": result}


@router.post("/test")
async def send_test_notification():
    """
    Fire a demo test notification to verify the system works.
    Uses mock/console output if no real credentials are configured.
    """
    print("\n" + "=" * 60)
    print(" [TEST]  NEUROVIA NOTIFICATION SYSTEM - DEMO TEST")
    print("=" * 60)

    result = send_notification(
        user_id="system-test",
        email="test@neurovia.local",
        phone="+910000000000",
        subject="NeuroVia Test Email",
        message="This is a test notification from NeuroVia. Both email and SMS systems are working correctly.",
    )

    print("\n" + "=" * 60)
    print(" [RESULTS]  TEST RESULTS")
    print("=" * 60)
    print(f"   Email: {result.get('email', {}).get('method', 'skipped')} - {'SUCCESS' if result.get('email', {}).get('success') else 'FAILED'}")
    print(f"   SMS:   {result.get('sms', {}).get('method', 'skipped')} - {'SUCCESS' if result.get('sms', {}).get('success') else 'FAILED'}")
    print(f"   Overall: {'PASS' if result['overall_success'] else 'FAIL'}")
    print("=" * 60 + "\n")

    return {
        "status": "test_complete",
        "email_result": result.get("email"),
        "sms_result": result.get("sms"),
        "overall_success": result["overall_success"],
    }
