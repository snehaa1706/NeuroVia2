"""
NeuroVia i18n Language Service
Safe translation layer with English fallback.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

TRANSLATIONS: Dict[str, Dict[str, str]] = {}
SUPPORTED_LANGUAGES = ["en", "hi", "kn", "ta"]


def load_translations():
    """Load translations from JSON file. Safe — defaults to empty dict on failure."""
    global TRANSLATIONS
    try:
        path = Path(__file__).parent / "translations.json"
        with open(path, "r", encoding="utf-8") as f:
            TRANSLATIONS = json.load(f)
        logger.info(f"[i18n] Loaded translations for: {list(TRANSLATIONS.keys())}")
    except Exception as e:
        logger.warning(f"[i18n] Failed to load translations: {e}. Falling back to empty.")
        TRANSLATIONS = {"en": {}}


# Load once at import time
load_translations()


def get_translation(key: str, lang: str = "en") -> str:
    """
    Get a translated string by key and language code.
    Falls back to English if the language or key is missing.
    Falls back to the key itself if English also missing.
    """
    if lang not in TRANSLATIONS:
        lang = "en"

    return TRANSLATIONS.get(lang, {}).get(
        key,
        TRANSLATIONS.get("en", {}).get(key, key)
    )


def get_section(section_prefix: str, lang: str = "en") -> Dict[str, str]:
    """
    Get all translations matching a prefix (e.g., 'ad8_' returns all AD8 questions).
    Falls back to English for missing keys.
    """
    if lang not in TRANSLATIONS:
        lang = "en"

    lang_data = TRANSLATIONS.get(lang, {})
    en_data = TRANSLATIONS.get("en", {})

    result = {}
    # Collect from English first (ensures completeness), then override with target lang
    for key, value in en_data.items():
        if key.startswith(section_prefix):
            result[key] = lang_data.get(key, value)

    return result


def get_all_translations(lang: str = "en") -> Dict[str, str]:
    """Return the full translation dictionary for a language, with English fallback."""
    if lang not in TRANSLATIONS:
        lang = "en"

    en_data = TRANSLATIONS.get("en", {})
    lang_data = TRANSLATIONS.get(lang, {})

    # Merge: English base + target language overrides
    merged = {**en_data, **lang_data}
    return merged


def is_supported_language(lang: str) -> bool:
    """Check if a language code is supported."""
    return lang in SUPPORTED_LANGUAGES
