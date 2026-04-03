from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.models.alert import AlertResponse

router = APIRouter()


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router.get("/")
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


@router.put("/{alert_id}/read")
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
