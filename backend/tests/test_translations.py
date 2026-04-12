import pytest
from app.i18n.language_service import get_translation, get_section, is_supported_language


def test_supported_languages():
    assert is_supported_language("en")
    assert is_supported_language("hi")
    assert is_supported_language("kn")
    assert is_supported_language("ta")
    assert not is_supported_language("fr")


def test_basic_translation():
    assert get_translation("q_date", "en") == "What is today's date?"
    assert get_translation("q_date", "hi") == "आज की तारीख क्या है?"


def test_fallback_to_english_for_missing_lang():
    # 'es' is not supported, should fall back to 'en'
    assert get_translation("btn_next", "es") == "Next"


def test_fallback_to_english_for_missing_key():
    # Assume 'nonexistent_key' is missing in 'hi'
    # It should fall back to English if it exists, but since it doesn't, it returns key
    assert get_translation("nonexistent_key", "hi") == "nonexistent_key"


def test_section_loading():
    ta_ad8 = get_section("ad8_", "ta")
    assert len(ta_ad8) == 8
    assert "ad8_q1" in ta_ad8
    assert "பாதிக்கிறது" in ta_ad8.get("ad8_q1", "") or "பிரச்சினைகள்" in ta_ad8.get("ad8_q1", "") # Using fragments for robust test
