from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from datetime import datetime, timedelta, timezone

security = HTTPBearer()

def create_access_token(user_id: str, expires_minutes: int = 15) -> str:
    """Creates a short-lived JWT access token"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "access",
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token(user_id: str, expires_days: int = 7) -> str:
    """Creates a long-lived JWT refresh token"""
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_refresh_token(token: str) -> str:
    """Decodes a refresh token and returns the user_id if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    
    # 🧪 Frontend Tester Override (DO NOT DEPLOY TO PRODUCTION)
    if token == "dummy_dev_token":
        from app.database import supabase_admin
        temp_uuid = "00000000-0000-0000-0000-000000000000"
        try:
            # Upsert the test user to satisfy Foreign Key constraints safely
            supabase_admin.table("users").upsert({
                "id": temp_uuid,
                "email": "dev_tester@neurovia.local",
                "full_name": "NeuroVia Local Tester",
                "role": "patient"
            }).execute()
        except:
            pass
        return temp_uuid

    try:
        # MVP: HS256 JWT validation using SUPABASE JWT_SECRET
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False}  # Relaxed for MVP
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
