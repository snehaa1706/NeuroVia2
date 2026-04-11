import json
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_supabase
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
            access_token=auth_response.session.access_token if auth_response.session else "",
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

        return AuthResponse(
            access_token=auth_response.session.access_token,
            user=profile,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/me", response_model=UserProfile)
async def get_current_user(request: Request):
    """Get current authenticated user profile."""
    sb = get_supabase()
    try:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "")
        user_response = sb.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        result = (
            sb.table("users")
            .select("*")
            .eq("id", user_response.user.id)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Not authenticated")


@router.put("/profile", response_model=UserProfile)
async def update_profile(request: Request, update_data: UserProfileUpdate):
    """Update user profile."""
    sb = get_supabase()
    try:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "")
        user_response = sb.auth.get_user(token)
        user_id = None

        if user_response and getattr(user_response, "user", None):
            user_id = user_response.user.id
        else:
            # Fallback for fake/dummy token on local restarts
            try:
                import json, base64
                parts = token.split(".")
                if len(parts) == 3:
                    payload = parts[1] + "=" * (4 - len(parts[1]) % 4)
                    data = json.loads(base64.urlsafe_b64decode(payload))
                    user_id = data.get("sub")
            except Exception:
                pass

        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")

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
    except HTTPException:
        raise
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

    sb = get_supabase()
    body = await request.json()
    token = body.get("token")
    role = body.get("role", "user")
    specialty = body.get("specialty")
    bio = body.get("bio")
    location = body.get("location")
    experience = body.get("experience")
    gender = body.get("gender")
    avatar_url = body.get("avatar_url")

    # Debug: Check settings
    print(f"DEBUG: GOOGLE_CLIENT_ID value in settings: '{settings.GOOGLE_CLIENT_ID}'")

    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    try:
        # Verify the Google token
        user_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = user_info.get("email")
        name = user_info.get("name", "Google User")
        picture = user_info.get("picture", "")

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")

        # Check if user already exists in our users table
        existing = sb.table("users").select("*").eq("email", email).execute()

        if existing.data and len(existing.data) > 0:
            # User exists — sign them in
            user_data = existing.data[0]

            # Try to sign in with Supabase Auth using a known password pattern
            # For Google users, we use a deterministic password hash
            google_password = f"google_oauth_{user_info['sub']}"

            try:
                auth_response = sb.auth.sign_in_with_password(
                    {"email": email, "password": google_password}
                )
                access_token = auth_response.session.access_token
            except Exception:
                # If Supabase auth fails (user was created with different method),
                # sign up again with the google password to create auth entry
                try:
                    auth_response = sb.auth.sign_up(
                        {
                            "email": email,
                            "password": google_password,
                            "options": {"data": {"full_name": name, "role": user_data.get("role", "user")}}
                        }
                    )
                    access_token = auth_response.session.access_token if auth_response.session else ""
                except Exception:
                    # Last resort — generate a simple session token
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
            # New user registration via Google
            if role == "doctor" and not specialty:
                raise HTTPException(status_code=428, detail="Doctor profile details required")

            google_password = f"google_oauth_{user_info['sub']}"

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

            if not auth_response.user:
                raise HTTPException(status_code=400, detail="Failed to create Google user")

            user_record = {
                "id": auth_response.user.id,
                "email": email,
                "full_name": name,
                "role": role,
                "avatar_url": avatar_url or picture,
            }
            if role == "doctor":
                user_record.update({
                    "specialty": specialty,
                    "bio": bio,
                    "location": location,
                    "experience": experience,
                    "gender": gender,
                })

            sb.table("users").insert(user_record).execute()

            profile = UserProfile(
                id=auth_response.user.id,
                email=email,
                full_name=name,
                role=role,
                avatar_url=user_record["avatar_url"],
                specialty=user_record.get("specialty"),
                bio=user_record.get("bio"),
                location=user_record.get("location"),
                experience=user_record.get("experience"),
                gender=user_record.get("gender"),
            )

            return AuthResponse(
                access_token=auth_response.session.access_token if auth_response.session else "",
                user=profile,
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
