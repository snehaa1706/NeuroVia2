import json
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_supabase
from app.core.auth import get_current_user, create_access_token, create_refresh_token, decode_refresh_token
from app.models.user import (
    UserRegister,
    UserLogin,
    UserProfile,
    UserProfileUpdate,
    AuthResponse,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=AuthResponse)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserRegister):
    """Register a new user."""
    sb = get_supabase()
    try:
        auth_response = sb.auth.sign_up(
            {
                "email": user_data.email,
                "password": user_data.password,
                "options": {
                    "data": {
                        "full_name": user_data.full_name,
                        "role": user_data.role.value,
                        "phone": user_data.phone,
                        "date_of_birth": str(user_data.date_of_birth) if user_data.date_of_birth else None,
                    }
                },
            }
        )

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        user_record = {
            "id": auth_response.user.id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role.value,
        }
        if user_data.phone: user_record["phone"] = user_data.phone
        if user_data.date_of_birth: user_record["date_of_birth"] = str(user_data.date_of_birth)
        if hasattr(user_data, "avatar_url") and user_data.avatar_url: user_record["avatar_url"] = user_data.avatar_url
        # Restored missing schema columns after applying staging fix
        if hasattr(user_data, "specialty") and user_data.specialty: user_record["specialty"] = user_data.specialty
        if hasattr(user_data, "bio") and user_data.bio: user_record["bio"] = user_data.bio
        if hasattr(user_data, "location") and user_data.location: user_record["location"] = user_data.location
        if hasattr(user_data, "experience") and user_data.experience: user_record["experience"] = user_data.experience
        if hasattr(user_data, "gender") and user_data.gender: user_record["gender"] = user_data.gender

        sb.table("users").insert(user_record).execute()

        profile = UserProfile(
            id=auth_response.user.id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            phone=user_data.phone,
            date_of_birth=user_data.date_of_birth,
            avatar_url=user_data.avatar_url,
            specialty=user_data.specialty,
            bio=user_data.bio,
            location=user_data.location,
            experience=user_data.experience,
            gender=user_data.gender,
        )

        return AuthResponse(
            access_token=create_access_token(user_record["id"]),
            refresh_token=create_refresh_token(user_record["id"]),
            user=profile,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    """Login user."""
    sb = get_supabase()
    try:
        auth_response = sb.auth.sign_in_with_password(
            {"email": credentials.email, "password": credentials.password}
        )

        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Fetch user profile from users table
        result = (
            sb.table("users")
            .select("*")
            .eq("id", auth_response.user.id)
            .single()
            .execute()
        )
        user_data = result.data

        profile = UserProfile(
            id=user_data["id"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            phone=user_data.get("phone"),
            date_of_birth=user_data.get("date_of_birth"),
            avatar_url=user_data.get("avatar_url"),
            specialty=user_data.get("specialty"),
            bio=user_data.get("bio"),
            location=user_data.get("location"),
            experience=user_data.get("experience"),
            gender=user_data.get("gender"),
            created_at=user_data.get("created_at"),
        )

        days = 30 if credentials.remember_me else 7
        return AuthResponse(
            access_token=create_access_token(user_data["id"]),
            refresh_token=create_refresh_token(user_data["id"], expires_days=days),
            user=profile,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/me", response_model=UserProfile)
async def get_my_profile(user_id: str = Depends(get_current_user)):
    """Get current authenticated user profile."""
    sb = get_supabase()
    try:
        result = (
            sb.table("users")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        user_data = result.data

        return UserProfile(
            id=user_data["id"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            phone=user_data.get("phone"),
            date_of_birth=user_data.get("date_of_birth"),
            avatar_url=user_data.get("avatar_url"),
            specialty=user_data.get("specialty"),
            bio=user_data.get("bio"),
            location=user_data.get("location"),
            experience=user_data.get("experience"),
            gender=user_data.get("gender"),
            created_at=user_data.get("created_at"),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Not authenticated")


@router.put("/profile", response_model=UserProfile)
async def update_profile(update_data: UserProfileUpdate, user_id: str = Depends(get_current_user)):
    """Update user profile."""
    sb = get_supabase()
    try:
        update_dict = update_data.model_dump(exclude_none=True)
        if "date_of_birth" in update_dict:
            update_dict["date_of_birth"] = str(update_dict["date_of_birth"])

        result = (
            sb.table("users")
            .update(update_dict)
            .eq("id", user_id)
            .execute()
        )

        user_data = result.data[0]
        return UserProfile(
            id=user_data["id"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            phone=user_data.get("phone"),
            date_of_birth=user_data.get("date_of_birth"),
            avatar_url=user_data.get("avatar_url"),
            specialty=user_data.get("specialty"),
            bio=user_data.get("bio"),
            location=user_data.get("location"),
            experience=user_data.get("experience"),
            gender=user_data.get("gender"),
            created_at=user_data.get("created_at"),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/google")
async def google_auth(request: Request):
    """
    Authenticate a user via Google OAuth2 token.
    If the user doesn't exist, creates a new account automatically.
    """
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from app.config import settings
    import uuid
    import logging

    logger = logging.getLogger(__name__)

    sb = get_supabase()
    body = await request.json()
    token = body.get("token")
    role = body.get("role", "patient")
    # Normalize role: only 'patient', 'caregiver', 'doctor' are valid
    if role not in ("patient", "caregiver", "doctor"):
        role = "patient"
    specialty = body.get("specialty")
    bio = body.get("bio")
    location = body.get("location")
    experience = body.get("experience")
    gender = body.get("gender")
    avatar_url = body.get("avatar_url")

    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    # ----- Step 1: Verify the Google token -----
    try:
        user_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        logger.warning(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    email = user_info.get("email")
    name = user_info.get("name", "Google User")
    picture = user_info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Email not found in Google token")

    # ----- Step 2: Look up user and authenticate -----
    try:
        # Check if user already exists in our users table
        existing = sb.table("users").select("*").eq("email", email).execute()

        google_password = f"google_oauth_{user_info['sub']}"

        if existing.data and len(existing.data) > 0:
            # User exists in our users table — sign them in
            user_data = existing.data[0]

            # Try multiple auth strategies to obtain a valid session
            access_token = ""

            # Strategy 1: Sign in with the Google-derived password
            try:
                auth_response = sb.auth.sign_in_with_password(
                    {"email": email, "password": google_password}
                )
                access_token = auth_response.session.access_token
            except Exception as e:
                logger.debug(f"Google auth strategy 1 (sign_in) failed for {email}: {e}")

            # Strategy 2: Try sign_up (creates auth entry if it doesn't exist yet)
            if not access_token:
                try:
                    auth_response = sb.auth.sign_up(
                        {
                            "email": email,
                            "password": google_password,
                            "options": {"data": {"full_name": name, "role": user_data.get("role", "user")}}
                        }
                    )
                    if auth_response.session:
                        access_token = auth_response.session.access_token
                except Exception as e:
                    logger.debug(f"Google auth strategy 2 (sign_up) failed for {email}: {e}")

            # Strategy 3: Fallback token if all Supabase auth methods fail
            if not access_token:
                access_token = str(uuid.uuid4())

            profile = UserProfile(
                id=user_data["id"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                role=user_data.get("role", "user"),
                phone=user_data.get("phone"),
                avatar_url=user_data.get("avatar_url") or picture,
                specialty=user_data.get("specialty"),
                bio=user_data.get("bio"),
                location=user_data.get("location"),
                experience=user_data.get("experience"),
                gender=user_data.get("gender"),
                created_at=user_data.get("created_at"),
            )

            return AuthResponse(access_token=access_token, user=profile)

        else:
            # User does NOT exist in our users table
            if role == "doctor" and not specialty:
                raise HTTPException(status_code=428, detail="Doctor profile details required")

            # Try sign_up first; if user already exists in Supabase Auth
            # (but not in our users table), fall back to sign_in
            auth_user_id = None
            access_token = ""

            try:
                auth_response = sb.auth.sign_up(
                    {
                        "email": email,
                        "password": google_password,
                        "options": {
                            "data": {
                                "full_name": name,
                                "role": role,
                            }
                        },
                    }
                )
                if auth_response.user:
                    auth_user_id = auth_response.user.id
                    # Handle obfuscated sign_up response (email confirmation enabled):
                    # Supabase returns a user with empty identities instead of raising.
                    identities = getattr(auth_response.user, 'identities', None)
                    if identities is not None and len(identities) == 0:
                        # Fake response — user already exists, treat as sign-in needed
                        auth_user_id = None
                if auth_response.session:
                    access_token = auth_response.session.access_token
            except Exception as e:
                logger.debug(f"Google auth new-user sign_up failed for {email}: {e}")

            # Fallback: try signing in with the Google-derived password
            if not auth_user_id or not access_token:
                try:
                    auth_response = sb.auth.sign_in_with_password(
                        {"email": email, "password": google_password}
                    )
                    if auth_response.user and not auth_user_id:
                        auth_user_id = auth_response.user.id
                    if auth_response.session and not access_token:
                        access_token = auth_response.session.access_token
                except Exception as e:
                    logger.debug(f"Google auth new-user sign_in fallback failed for {email}: {e}")

            # If we still don't have an auth user ID, generate one
            if not auth_user_id:
                auth_user_id = str(uuid.uuid4())
            if not access_token:
                access_token = str(uuid.uuid4())

            user_record = {
                "id": auth_user_id,
                "email": email,
                "full_name": name,
                "role": role,
                "avatar_url": avatar_url or picture,
            }
            # Restored DB insertion mappings after database schema fix
            if role == "doctor":
                user_record.update({
                    "specialty": specialty,
                    "bio": bio,
                    "location": location,
                    "experience": experience,
                    "gender": gender,
                })

            # Insert into users table (handle duplicate gracefully)
            try:
                sb.table("users").insert(user_record).execute()
            except Exception:
                # Row may already exist from a race condition — fetch it
                re_check = sb.table("users").select("*").eq("email", email).execute()
                if re_check.data and len(re_check.data) > 0:
                    user_record = re_check.data[0]
                    auth_user_id = user_record["id"]

            profile = UserProfile(
                id=auth_user_id,
                email=email,
                full_name=name,
                role=role,
                avatar_url=user_record.get("avatar_url", picture),
                specialty=user_record.get("specialty"),
                bio=user_record.get("bio"),
                location=user_record.get("location"),
                experience=user_record.get("experience"),
                gender=user_record.get("gender"),
            )

            return AuthResponse(
                access_token=create_access_token(auth_user_id),
                refresh_token=create_refresh_token(auth_user_id),
                user=profile,
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth failed for {email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("20/minute")
async def refresh_session(request: Request, data: RefreshRequest):
    """Generate a new access token using a valid refresh token."""
    sb = get_supabase()
    try:
        user_id = decode_refresh_token(data.refresh_token)
        
        result = sb.table("users").select("*").eq("id", user_id).single().execute()
        user_data = result.data
        
        profile = UserProfile(
            id=user_data["id"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            phone=user_data.get("phone"),
            date_of_birth=user_data.get("date_of_birth"),
            avatar_url=user_data.get("avatar_url"),
            specialty=user_data.get("specialty"),
            bio=user_data.get("bio"),
            location=user_data.get("location"),
            experience=user_data.get("experience"),
            gender=user_data.get("gender"),
            created_at=user_data.get("created_at"),
        )
        
        return AuthResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
            user=profile,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid session")
