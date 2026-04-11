"""
NeuroVia AI Configuration Layer — Phase 11
Centralized feature toggles for all AI modules.
All settings default to True unless explicitly disabled via environment variables.
"""

import os


class AIConfig:
    """Centralized AI feature toggles. Read from environment at import time."""

    ENABLE_AI: bool = os.getenv("ENABLE_AI", "true").lower() == "true"
    ENABLE_RISK_PREDICTION: bool = os.getenv("ENABLE_RISK_PREDICTION", "true").lower() == "true"
    ENABLE_TREND_ANALYSIS: bool = os.getenv("ENABLE_TREND_ANALYSIS", "true").lower() == "true"
    ENABLE_SEMANTIC_VALIDATION: bool = os.getenv("ENABLE_SEMANTIC_VALIDATION", "true").lower() == "true"
    ENABLE_CLOCK_ANALYSIS: bool = os.getenv("ENABLE_CLOCK_ANALYSIS", "true").lower() == "true"
    ENABLE_LLM_INSIGHTS: bool = os.getenv("ENABLE_LLM_INSIGHTS", "true").lower() == "true"

    # LLM settings
    LLM_PRIMARY: str = os.getenv("LLM_PRIMARY", "ollama")  # "ollama" or "openai"
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "30"))

    # Cache settings
    CACHE_TTL_SECONDS: int = int(os.getenv("AI_CACHE_TTL", "300"))  # 5 minutes
    CACHE_MAX_SIZE: int = int(os.getenv("AI_CACHE_MAX_SIZE", "256"))

    @classmethod
    def is_feature_enabled(cls, feature: str) -> bool:
        """Check if a specific AI feature is enabled."""
        if not cls.ENABLE_AI:
            return False
        return getattr(cls, f"ENABLE_{feature.upper()}", False)

    @classmethod
    def summary(cls) -> dict:
        """Return a dict of all AI feature states for debugging."""
        return {
            "ai_enabled": cls.ENABLE_AI,
            "risk_prediction": cls.ENABLE_RISK_PREDICTION,
            "trend_analysis": cls.ENABLE_TREND_ANALYSIS,
            "semantic_validation": cls.ENABLE_SEMANTIC_VALIDATION,
            "clock_analysis": cls.ENABLE_CLOCK_ANALYSIS,
            "llm_insights": cls.ENABLE_LLM_INSIGHTS,
            "llm_primary": cls.LLM_PRIMARY,
            "ollama_model": cls.OLLAMA_MODEL,
        }


ai_config = AIConfig()
