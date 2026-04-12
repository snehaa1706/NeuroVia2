import os

try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

def send_sms(to_number: str, message: str):
    """
    Send an SMS notification via Twilio API.
    """
    print("Sending SMS...")
    
    if not TWILIO_AVAILABLE:
        print(f"Mock SMS sent to {to_number}. Message: {message} (Module not installed)")
        print("SMS Sent SUCCESS")
        return {"success": True, "method": "mock", "note": "twilio module not installed"}
        
    try:
        if not TWILIO_ACCOUNT_SID or TWILIO_ACCOUNT_SID == "your_twilio_sid_here":
            print(f"Mock SMS sent to {to_number}. Message: {message}")
            print("SMS Sent SUCCESS")
            return {"success": True, "method": "mock"}

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        response = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        print("SMS Sent SUCCESS")
        return {"success": True, "method": "twilio", "sid": response.sid}
    except Exception as e:
        print(f"SMS failed: {e}")
        return {"success": False, "error": str(e)}
