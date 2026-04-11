import os
from pathlib import Path
from dotenv import load_dotenv

# Load from backend root (where .env lives)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)


class Settings:
    AI_ENABLED: bool = os.getenv("AI_ENABLED", "true").lower() == "true"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama").lower()
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "neurovia-secret-key")
    SUPABASE_JWKS_URL: str = os.getenv("SUPABASE_JWKS_URL", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")


settings = Settings()
