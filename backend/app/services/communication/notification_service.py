from typing import Optional
from app.services.communication.email_service import send_email
from app.services.communication.sms_service import send_sms

def send_notification(
    email: Optional[str] = None, 
    phone: Optional[str] = None, 
    subject: str = "NeuroVia", 
    message: str = "", 
    html_content: Optional[str] = None, 
    **kwargs
):
    """
    Unified communication method extending email and sms capabilities.
    """
    results = {
        "email": None,
        "sms": None,
        "overall_success": False
    }

    success_count = 0
    attempt_count = 0

    if email:
        attempt_count += 1
        html = html_content or f"<p>{message}</p>"
        email_res = send_email(email, subject, html)
        results["email"] = email_res
        if email_res.get("success"):
            success_count += 1

    if phone:
        attempt_count += 1
        sms_res = send_sms(phone, message)
        results["sms"] = sms_res
        if sms_res.get("success"):
            success_count += 1

    if attempt_count > 0 and success_count > 0:
        results["overall_success"] = True

    return results
