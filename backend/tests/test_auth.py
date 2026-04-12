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
