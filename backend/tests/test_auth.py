import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from app.core.auth import create_access_token, create_refresh_token, decode_refresh_token
from app.config import settings

def test_create_access_token():
    user_id = "test-1234-uuid"
    token = create_access_token(user_id, expires_minutes=15)
    
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token():
    user_id = "test-1234-uuid"
    token = create_refresh_token(user_id, expires_days=7)
    
    decoded_id = decode_refresh_token(token)
    assert decoded_id == user_id


def test_decode_refresh_token_fails_for_access_token():
    user_id = "test-1234-uuid"
    access_token = create_access_token(user_id)
    
    import fastapi
    with pytest.raises(fastapi.HTTPException) as excinfo:
        decode_refresh_token(access_token)
        
    assert excinfo.value.status_code == 401
    assert "Invalid token type" in excinfo.value.detail


def test_decode_expired_token():
    # Construct an expired token manually
    expire = datetime.now(timezone.utc) - timedelta(minutes=5)
    payload = {
        "sub": "test-1234-uuid",
        "exp": expire,
        "type": "refresh"
    }
    expired_token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    
    import fastapi
    with pytest.raises(fastapi.HTTPException) as excinfo:
        decode_refresh_token(expired_token)
        
    assert excinfo.value.status_code == 401
    assert "Invalid or expired" in excinfo.value.detail


def test_register_with_avatar():
    import uuid
    from fastapi.testclient import TestClient
    from app.main import app
    from app.database import get_supabase
    
    sb = get_supabase()
    client = TestClient(app)
    
    unique_email = f"test_doctor_{uuid.uuid4().hex[:6]}@example.com"
    payload = {
        "email": unique_email,
        "password": "StrongPassword123!",
        "full_name": "Dr. Test Avatar",
        "role": "doctor",
        "avatar_url": "/uploads/test_avatar.jpg",
        "specialty": "Neurology"
    }
    
    # 1. Test Registration
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200, f"Registration failed: {response.text}"
    
    data = response.json()
    assert "user" in data
    assert data["user"]["avatar_url"] == "/uploads/test_avatar.jpg", "avatar_url was not returned in registration response"
    
    # 2. Test Login
    login_payload = {
        "email": unique_email,
        "password": "StrongPassword123!"
    }
    login_response = client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 200
    
    login_data = login_response.json()
    assert login_data["user"]["avatar_url"] == "/uploads/test_avatar.jpg", "avatar_url was not properly saved to DB and restored on login"
    
    # Cleanup DB
    sb.auth.admin.delete_user(login_data["user"]["id"])
    sb.table("users").delete().eq("id", login_data["user"]["id"]).execute()
