import os

try:
    import resend
    resend.api_key = os.getenv("RESEND_API_KEY")
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    resend = None

RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "NeuroVia <onboarding@resend.dev>")

def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email via Resend API.
    Gracefully handles errors or missing keys by printing to console.
    Falls back to mock when Resend is in test mode (unverified domain).
    """
    print("Sending Email...")
    
    if not RESEND_AVAILABLE:
        print(f"[Mock] Email to {to_email}. Subject: {subject} (resend not installed)")
        print("Email Sent SUCCESS")
        return {"success": True, "method": "mock", "note": "resend module not installed"}
        
    try:
        if not resend.api_key or resend.api_key == "your_resend_key_here":
            print(f"[Mock] Email to {to_email}. Subject: {subject} (no API key)")
            print("Email Sent SUCCESS")
            return {"success": True, "method": "mock"}

        params = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        response = resend.Emails.send(params)
        print("Email Sent SUCCESS")
        return {"success": True, "method": "resend", "data": response}
    except Exception as e:
        error_msg = str(e)
        print(f"Email send error: {error_msg}")
        # Resend test-mode: can only send to verified account email
        if "only send testing emails" in error_msg.lower() or "verify a domain" in error_msg.lower():
            print(f"[Mock-fallback] Resend in test mode. Mock email to {to_email}. Subject: {subject}")
            print("Email Sent SUCCESS (mock fallback)")
            return {"success": True, "method": "mock", "note": "resend test-mode, used mock fallback"}
        return {"success": False, "error": error_msg}
