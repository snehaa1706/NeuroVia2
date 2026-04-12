"""
NeuroVia Configuration Validator
Ensures the backend fails fast if critical environment variables are missing.
"""

import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)


def validate_credentials():
    """Validates the presence of required environment variables for production readiness."""
    logger.info("Validating environment configuration...")
    
    # Required keys that will break core functionality if missing
    required_keys = [
        ("SUPABASE_URL", settings.SUPABASE_URL),
        ("SUPABASE_KEY", settings.SUPABASE_KEY),
        ("JWT_SECRET", settings.JWT_SECRET),
        ("GOOGLE_CLIENT_ID", settings.GOOGLE_CLIENT_ID)
    ]
    
    missing = []
    for key_name, val in required_keys:
        if not val or val.strip() == "" or val == "your_supabase_url":
            missing.append(key_name)
            
    if missing:
        msg = f"Application failed to start. Missing or invalid required environment variables: {', '.join(missing)}"
        logger.error(msg)
        raise RuntimeError(msg)

    # URL Scheme validation
    if not settings.SUPABASE_URL.startswith("http"):
        raise RuntimeError(f"SUPABASE_URL must start with http:// or https://. Got: {settings.SUPABASE_URL}")

    # JWT Secret length check
    if len(settings.JWT_SECRET) < 16:
        logger.warning("JWT_SECRET is less than 16 characters. This is not recommended for production.")

    # Optional but important warnings
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_key_here":
        logger.warning("OPENAI_API_KEY is not set or uses default placeholder. Cloud AI features will gracefully fallback or fail.")
        
    logger.info("Environment configuration validated successfully.")
