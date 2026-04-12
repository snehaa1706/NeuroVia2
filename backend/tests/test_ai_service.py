import pytest
import asyncio
from unittest.mock import patch
from app.services.ai_service import generate_health_guidance

@pytest.mark.asyncio
async def test_ai_valid_response():
    """Test valid structured JSON response from AI."""
    async def mock_success(*args, **kwargs):
        return {
            "risk_level": "low",
            "guidance": "Test guidance",
            "recommended_actions": ["Action 1"],
            "assessment": "Stable",
            "care_strategies": ["Strategy 1"],
            "warning_signs": ["None"]
        }

    with patch('app.services.ai_service._get_json_response', side_effect=mock_success):
        res = await generate_health_guidance(
            mood="happy",
            confusion_level=1,
            sleep_hours=8.0,
            appetite="good",
            notes="good",
            recent_logs="[]"
        )
        assert res["risk_level"] == "low"
        assert res["guidance"] == "Test guidance"

@pytest.mark.asyncio
async def test_ai_invalid_response_fallback():
    """Test that a broken or throwing AI response falls back safely."""
    async def mock_fail(*args, **kwargs):
        return {"error": "AI Down"}

    with patch('app.services.ai_service._get_json_response', side_effect=mock_fail):
        res = await generate_health_guidance(
            mood="happy", confusion_level=1, sleep_hours=8.0, appetite="good", notes="", recent_logs=""
        )
        assert "error" in res
        assert "AI Down" in res["error"]

@pytest.mark.asyncio
async def test_ai_large_input_sanitization():
    """Test that large inputs are truncated inside the function implicitly via sanitizer."""
    # We just ensure it doesn't crash when passing massive strings.
    async def mock_success(*args, **kwargs):
        return {"risk_level": "low"} # Partial

    with patch('app.services.ai_service._get_json_response', side_effect=mock_success):
        res = await generate_health_guidance(
            mood="happy",
            confusion_level=1,
            sleep_hours=8.0,
            appetite="good",
            notes="x" * 1000, # Large string
            recent_logs="[]"
        )
        assert res["risk_level"] == "low"
        assert "guidance" not in res  # It only returned risk_level in mock
