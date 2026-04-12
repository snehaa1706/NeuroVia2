"""Activity service for generating and managing cognitive exercises."""

from app.services.ai_service import generate_activity as ai_generate_activity


async def create_activity(
    activity_type: str,
    difficulty: str = "easy",
    severity: str = "mild",
) -> dict:
    """Generate a cognitive activity using the AI service."""
    return await ai_generate_activity(activity_type, difficulty, severity)


def evaluate_activity_result(
    activity_content: dict, user_responses: dict
) -> tuple[float, str]:
    """Basic evaluation of activity results. Returns (score, feedback)."""
    expected = activity_content.get("expected_responses", [])
    prompts = activity_content.get("prompts", [])

    if not expected or not prompts:
        return 0.0, "Activity completed. Great effort!"

    total = len(expected)
    correct = 0

    user_answers = list(user_responses.values())
    for i, exp in enumerate(expected):
        if i < len(user_answers):
            if str(user_answers[i]).lower().strip() == str(exp).lower().strip():
                correct += 1

    score = (correct / total) * 100 if total > 0 else 0
    if score >= 80:
        feedback = "Excellent performance! Your memory skills are strong."
    elif score >= 50:
        feedback = "Good effort! Keep practicing to strengthen your cognitive abilities."
    else:
        feedback = "Keep trying! Regular practice will help improve your skills."

    return score, feedback


"""Alert service with rule-based triggers.

Rule-based alerts fire first; AI interprets only after.
"""

from app.modules.patient.model import AlertType, AlertSeverity


from typing import Optional

def check_medication_alerts(
    user_id: str, missed_count: int
) -> Optional[dict]:
    """Generate alert if 2+ medications missed."""
    if missed_count >= 2:
        return {
            "user_id": user_id,
            "alert_type": AlertType.medication_missed,
            "severity": AlertSeverity.warning if missed_count < 4 else AlertSeverity.critical,
            "message": f"Patient has missed {missed_count} medication doses recently.",
        }
    return None


def check_confusion_alert(
    user_id: str, confusion_level: int
) -> Optional[dict]:
    """Generate alert if confusion level >= 8."""
    if confusion_level >= 8:
        return {
            "user_id": user_id,
            "alert_type": AlertType.confusion_spike,
            "severity": AlertSeverity.critical if confusion_level >= 9 else AlertSeverity.warning,
            "message": f"Patient confusion level is critically high ({confusion_level}/10).",
        }
    return None


def check_score_decline(
    user_id: str,
    previous_score: float,
    current_score: float,
) -> Optional[dict]:
    """Generate alert if cognitive score declined significantly."""
    if previous_score > 0 and current_score < previous_score * 0.75:
        decline_pct = round((1 - current_score / previous_score) * 100)
        return {
            "user_id": user_id,
            "alert_type": AlertType.score_decline,
            "severity": AlertSeverity.warning,
            "message": f"Cognitive score declined by {decline_pct}% compared to previous screening.",
        }
    return None


def check_incident_alert(user_id: str, description: str) -> dict:
    """Always generate an alert for logged incidents."""
    return {
        "user_id": user_id,
        "alert_type": AlertType.incident,
        "severity": AlertSeverity.warning,
        "message": f"Incident reported: {description[:200]}",
    }
