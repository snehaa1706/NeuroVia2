import json
import logging
import random
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from pydantic import ValidationError

from app.database import get_supabase
from .model import (
    SessionStartRequest,
    TestSubmissionRequest,
    TestType,
    Difficulty,
    TEST_RESPONSE_SCHEMAS,
)



def score_ad8(responses: dict) -> tuple[float, float]:
    """Score the AD8 questionnaire. Each 'yes' = 1 point. Score >= 2 suggests concern."""
    max_score = 8.0
    score = sum(1 for v in responses.values() if v in [True, "yes", 1])
    return float(score), max_score


def score_orientation(responses: dict) -> tuple[float, float]:
    """Score orientation questions. Each correct answer = 1 point."""
    max_score = 5.0  # date, day, month, year, place
    score = sum(1 for v in responses.values() if v in [True, "correct", 1])
    return float(score), max_score


def score_verbal_fluency(responses: dict) -> tuple[float, float]:
    """Score verbal fluency. Count of valid words in category."""
    max_score = 20.0  # typical ceiling
    words = responses.get("words", [])
    if isinstance(words, list):
        score = float(len(words))
    else:
        score = float(responses.get("count", 0))
    return min(score, max_score), max_score


def score_trail_making(responses: dict) -> tuple[float, float]:
    """Score trail making test. Based on time and errors."""
    max_score = 100.0
    time_seconds = responses.get("time_seconds", 300)
    errors = responses.get("errors", 0)

    # Lower time & fewer errors = higher score
    time_score = max(0, 100 - (time_seconds / 3))
    error_penalty = errors * 10
    score = max(0, time_score - error_penalty)
    return float(score), max_score


def score_clock_drawing(responses: dict) -> tuple[float, float]:
    """Score clock drawing test. Uses simplified scoring (0-10)."""
    max_score = 10.0
    # If AI has already scored it, use that score
    score = float(responses.get("score", 0))
    return min(score, max_score), max_score


def score_moca(responses: dict) -> tuple[float, float]:
    """Score MoCA-inspired tasks. Max 30 points."""
    max_score = 30.0
    score = float(responses.get("total_score", 0))
    return min(score, max_score), max_score


SCORING_FUNCTIONS = {
    TestType.ad8: score_ad8,
    TestType.orientation: score_orientation,
    TestType.verbal_fluency: score_verbal_fluency,
    TestType.trail_making: score_trail_making,
    TestType.clock_drawing: score_clock_drawing,
    TestType.moca: score_moca,
}


def calculate_score(test_type: TestType, responses: dict) -> tuple[float, float]:
    """Calculate score for a given test type and responses."""
    scoring_fn = SCORING_FUNCTIONS.get(test_type)
    if scoring_fn:
        return scoring_fn(responses)
    return 0.0, 0.0


import app.utils.cognitive_tests.memory as memory_test
import app.utils.cognitive_tests.fluency as fluency_test
import app.utils.cognitive_tests.reaction as reaction_test
import app.utils.cognitive_tests.sequence as sequence_test

logger = logging.getLogger(__name__)

# ================================
# MOCK DATA FOR LOCAL DEVELOPMENT
# ================================
MOCK_SESSIONS = {}
_now = datetime.now(timezone.utc)
MOCK_RESULTS = [
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "memory_recall",
        "score": 88.0,
        "score_components": {"accuracy": 88, "response_time": 92},
        "responses": {},
        "time_taken_seconds": 38,
        "created_at": (_now - timedelta(days=1)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "verbal_fluency",
        "score": 82.0,
        "score_components": {"fluency": 82, "vocabulary": 78},
        "responses": {},
        "time_taken_seconds": 55,
        "created_at": (_now - timedelta(days=4)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "sequence_memory",
        "score": 75.0,
        "score_components": {"accuracy": 75, "sequence_length": 6},
        "responses": {},
        "time_taken_seconds": 42,
        "created_at": (_now - timedelta(days=8)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "reaction_time",
        "score": 70.0,
        "score_components": {"avg_reaction_ms": 450, "consistency": 70},
        "responses": {},
        "time_taken_seconds": 30,
        "created_at": (_now - timedelta(days=14)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "memory_recall",
        "score": 65.0,
        "score_components": {"accuracy": 65, "response_time": 60},
        "responses": {},
        "time_taken_seconds": 52,
        "created_at": (_now - timedelta(days=21)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "verbal_fluency",
        "score": 58.0,
        "score_components": {"fluency": 58, "vocabulary": 55},
        "responses": {},
        "time_taken_seconds": 60,
        "created_at": (_now - timedelta(days=30)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "sequence_memory",
        "score": 52.0,
        "score_components": {"accuracy": 52, "sequence_length": 4},
        "responses": {},
        "time_taken_seconds": 48,
        "created_at": (_now - timedelta(days=40)).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "user_id": "test-user-id",
        "test_type": "reaction_time",
        "score": 45.0,
        "score_components": {"avg_reaction_ms": 620, "consistency": 45},
        "responses": {},
        "time_taken_seconds": 35,
        "created_at": (_now - timedelta(days=50)).isoformat()
    },
]

# ================================
# CONSTANTS
# ================================
SESSION_MAX_AGE_MINUTES = 30

# ================================
# TEST DISPATCHER MAP
# ================================
TEST_MODULES = {
    TestType.memory_recall: memory_test,
    TestType.verbal_fluency: fluency_test,
    TestType.reaction_time: reaction_test,
    TestType.sequence_memory: sequence_test,
}

# ================================
# CONFIG GENERATORS
# ================================


def _generate_test_config(test_type: TestType, difficulty: Difficulty) -> dict:
    config: dict = {}

    if test_type == TestType.memory_recall:
        # Scale word count by difficulty
        count = {"easy": 3, "medium": 5, "hard": 8}[difficulty.value]
        pool = ["apple", "chair", "blue", "dog", "house", "car", "tree", "book", "sun", "water", "pen", "desk"]
        config["words"] = random.sample(pool, count)

    elif test_type == TestType.sequence_memory:
        length = {"easy": 4, "medium": 6, "hard": 8}[difficulty.value]
        config["sequence"] = [random.randint(0, 9) for _ in range(length)]

    elif test_type == TestType.verbal_fluency:
        # Provide a random letter or category for them to list words
        categories = ["animals", "foods", "countries", "items in a house"]
        config["category"] = random.choice(categories)

    # reaction_time needs no config
    return config


# ================================
# SESSION EXPIRATION HELPER
# ================================


def _check_session_expiration(session: dict, sb) -> None:
    """Mark session as expired and raise HTTP 400 if it exceeds SESSION_MAX_AGE_MINUTES."""
    started_at_str = session.get("started_at")
    if not started_at_str:
        return

    # Parse the ISO timestamp from the database
    if isinstance(started_at_str, str):
        started_at = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
    else:
        started_at = started_at_str

    now = datetime.now(timezone.utc)
    age_minutes = (now - started_at).total_seconds() / 60.0

    if age_minutes > SESSION_MAX_AGE_MINUTES:
        # Mark session as expired in DB
        sb.table("cognitive_sessions").update({
            "status": "expired",
        }).eq("id", session["id"]).execute()

        logger.warning(
            "cognitive_session_expired",
            extra={"session_id": session["id"], "user_id": session["user_id"], "age_minutes": round(age_minutes, 1)},
        )
        raise HTTPException(
            status_code=400,
            detail=f"Session expired. Tests must be completed within {SESSION_MAX_AGE_MINUTES} minutes.",
        )


# ================================
# SUMMARY CACHE HELPERS
# ================================


def _recompute_summary_from_results(user_id: str) -> dict:
    """Fallback: compute summary directly from cognitive_results rows."""
    sb = get_supabase()
    res = (
        sb.table("cognitive_results")
        .select("score")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    scores = [r["score"] for r in res.data]
    if not scores:
        return {
            "avg_score": None,
            "latest_score": None,
            "trend": "no_data",
            "recent_scores": [],
        }

    avg = sum(scores) / len(scores)
    latest = scores[0]

    # Trend Detection
    threshold = 5.0
    if latest < avg - threshold:
        trend = "declining"
    elif latest > avg + threshold:
        trend = "improving"
    else:
        trend = "stable"

    return {
        "avg_score": round(avg, 2),
        "latest_score": round(latest, 2),
        "trend": trend,
        "recent_scores": scores,
    }


def _update_summary_cache(user_id: str) -> None:
    """Upsert the cognitive_summary_cache row for a patient after a new result."""
    try:
        summary = _recompute_summary_from_results(user_id)
        sb = get_supabase()

        cache_record = {
            "user_id": user_id,
            "latest_score": summary["latest_score"],
            "average_score": summary["avg_score"],
            "trend_direction": summary["trend"],
            "recent_scores": json.dumps(summary["recent_scores"]),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        # Upsert: ON CONFLICT (user_id) DO UPDATE
        sb.table("cognitive_summary_cache").upsert(cache_record, on_conflict="user_id").execute()

        logger.info(
            "cognitive_summary_cache_updated",
            extra={"user_id": user_id, "latest_score": summary["latest_score"]},
        )
    except Exception as e:
        # Cache update failure should never break the submission flow
        logger.error("cognitive_summary_cache_update_failed", extra={"user_id": user_id, "error": str(e)})


# ================================
# SERVICE FUNCTIONS
# ================================


def start_session(user_id: str, payload: SessionStartRequest) -> dict:
    """Creates a new test session and generates the mandatory test_config."""
    if user_id == "test-user-id":
        # DEV MOCK OVERRIDE
        sess_id = str(uuid.uuid4())
        config = _generate_test_config(payload.test_type, payload.difficulty)
        session = {
            "id": sess_id,
            "user_id": user_id,
            "test_type": payload.test_type.value,
            "difficulty": payload.difficulty.value,
            "status": "in_progress",
            "test_config": config,
            "started_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_SESSIONS[sess_id] = session
        return session

    sb = get_supabase()

    config = _generate_test_config(payload.test_type, payload.difficulty)

    record = {
        "user_id": user_id,
        "test_type": payload.test_type.value,
        "difficulty": payload.difficulty.value,
        "status": "in_progress",
        "test_config": config,
    }

    result = sb.table("cognitive_sessions").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create cognitive session")

    return result.data[0]


def submit_test(user_id: str, session_id: str, payload: TestSubmissionRequest) -> dict:
    """Validates inputs, calculates score, stores result, and locks session."""
    if user_id == "test-user-id":
        if session_id not in MOCK_SESSIONS:
            raise HTTPException(status_code=404, detail="Session not found in mock store")
        session = MOCK_SESSIONS[session_id]
        if session["status"] != "in_progress":
            raise HTTPException(status_code=400, detail="Session not in progress")
        
        test_type = TestType(session["test_type"])
        module = TEST_MODULES.get(test_type)
        score, score_components = module.calculate_score(payload.responses, session["test_config"])
        session["status"] = "completed"
        res = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "test_type": test_type.value,
            "score": score,
            "score_components": score_components,
            "responses": payload.responses,
            "time_taken_seconds": payload.time_taken_seconds,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_RESULTS.insert(0, res)
        return res

    sb = get_supabase()

    # 1. Fetch & Validate Session
    session_res = sb.table("cognitive_sessions").select("*").eq("id", session_id).single().execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_res.data

    # Ownership Control
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to submit logic for this session")

    # Session State Control
    if session["status"] == "completed":
        raise HTTPException(status_code=409, detail="Duplicate submission. Session already completed.")
    if session["status"] == "expired":
        raise HTTPException(status_code=400, detail="Session has expired and cannot accept submissions.")
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Session is not in progress.")

    # 2. Session Expiration Check (30-minute window)
    _check_session_expiration(session, sb)

    test_type = TestType(session["test_type"])
    module = TEST_MODULES.get(test_type)
    if not module:
        raise HTTPException(status_code=500, detail="Test scoring module not found.")

    # 3. Pydantic Schema Validation (strict, internal)
    schema_class = TEST_RESPONSE_SCHEMAS.get(test_type)
    if schema_class:
        try:
            schema_class(**payload.responses)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid test response format: {e.errors()}")

    # 4. Legacy Validation Layer (defense-in-depth)
    if not module.validate_responses(payload.responses):
        raise HTTPException(status_code=400, detail="Invalid test response format given test expectations.")

    # 5. Calculate Score + Components
    score, score_components = module.calculate_score(payload.responses, session["test_config"])

    # 6. Persist Result
    try:
        result_record = {
            "session_id": session["id"],
            "user_id": user_id,
            "test_type": test_type.value,
            "score": score,
            "score_components": score_components,
            "responses": payload.responses,
            "time_taken_seconds": payload.time_taken_seconds,
        }
        res_db = sb.table("cognitive_results").insert(result_record).execute()

        # Mark session -> completed
        sb.table("cognitive_sessions").update({
            "status": "completed",
            "completed_at": "now()",
        }).eq("id", session["id"]).execute()

        logger.info(
            "cognitive_test_completed",
            extra={"user_id": user_id, "session_id": session["id"], "score": score},
        )

        # 7. Update summary cache asynchronously (best-effort)
        _update_summary_cache(user_id)

        return res_db.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")


def get_cognitive_history(requesting_user: dict, user_id: str) -> list[dict]:
    """Retrieve history for the specific user."""
    if user_id == "test-user-id":
        return sorted(MOCK_RESULTS, key=lambda x: x["created_at"], reverse=True)

    sb = get_supabase()

    req_id = requesting_user.get("id")

    if req_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot access other patient's records")

    res = (
        sb.table("cognitive_results")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return res.data or []


def compute_cognitive_summary(user_id: str) -> dict:
    """Read from cache first; fall back to live recompute if cache is missing."""
    if user_id == "test-user-id":
        scores = [r["score"] for r in MOCK_RESULTS]
        if not scores:
            return {"avg_score": None, "latest_score": None, "trend": "no_data", "recent_scores": [], "recent_results": []}
        avg = sum(scores) / len(scores)
        latest = scores[0]
        trend = "improving" if latest > avg + 5 else "declining" if latest < avg - 5 else "stable"
        recent_results = [
            {"score": r["score"], "test_type": r["test_type"], "created_at": r["created_at"]}
            for r in MOCK_RESULTS[:8]
        ]
        return {
            "avg_score": round(avg, 2),
            "latest_score": round(latest, 2),
            "trend": trend,
            "recent_scores": scores[:8],
            "recent_results": recent_results,
        }

    sb = get_supabase()

    # Try cache first
    try:
        cache_res = (
            sb.table("cognitive_summary_cache")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if cache_res.data:
            row = cache_res.data
            recent_scores = row.get("recent_scores", [])
            # Supabase may return JSONB as string or list
            if isinstance(recent_scores, str):
                recent_scores = json.loads(recent_scores)
            return {
                "avg_score": row.get("average_score"),
                "latest_score": row.get("latest_score"),
                "trend": row.get("trend_direction", "no_data"),
                "recent_scores": recent_scores,
            }
    except Exception:
        # Cache miss or table doesn't exist yet — fall through to live recompute
        logger.debug("cognitive_summary_cache_miss", extra={"user_id": user_id})

    # Fallback: recompute from results
    return _recompute_summary_from_results(user_id)


"""
Scoring Engine — Phase 9 (Dynamic Tests)
All scoring is deterministic except where AI hybrid is explicitly noted.
"""

from typing import List, Dict, Any
import logging
from app.services.ai_preprocessing import AIPreprocessing
from app.modules.screening.model import MemoryListResponse, MemoryStringResponse

logger = logging.getLogger(__name__)

def _normalize_string(val: str) -> str:
    if not val:
        return ""
    return str(val).lower().strip()

def _safe_intersection_count(user_list: List[str], expected_list: List[str]) -> int:
    import difflib
    if not user_list or not expected_list:
        return 0
    norm_user = set(_normalize_string(x) for x in user_list if x)
    norm_expected = set(_normalize_string(x) for x in expected_list if x)
    
    count = 0
    for u in norm_user:
        if u in norm_expected:
            count += 1
        else:
            closest = difflib.get_close_matches(u, norm_expected, n=1, cutoff=0.8)
            if closest:
                count += 1
    return count

# ============================================================
# LEVEL 1 SCORING
# ============================================================

async def score_level_1(ad8_answers: List[int], user_orientation: Dict[str, str], orientation_questions: List[Dict], user_recall: MemoryListResponse, expected_words: List[str]) -> Dict[str, Any]:
    """
    Score Level 1 (SCD).
    - AD8: sum of "yes" answers / 8
    - Orientation: MCQ-based with approximate scoring (adjacent month = 0.5)
    - Recall: AI hybrid with exact fallback
    """
    # 1. AD8 (Inverted: 0 "yes" answers = perfect cognitive health = 1.0)
    # AD8 counts problems — more "yes" = more concern. Invert for cognitive score.
    ad8_sum = sum(1 for a in ad8_answers if a == 1)
    norm_ad8 = max(0.0, min(1.0 - (ad8_sum / 8.0), 1.0))

    # 2. Orientation (MCQ with approximate scoring)
    orientation_score = 0.0
    orientation_max = 0
    for q in orientation_questions:
        qid = q.get("id", "")
        scoring_type = q.get("scoring", "exact")
        user_val = _normalize_string(user_orientation.get(qid, ""))
        
        if scoring_type == "self_report":
            # Location is self-reported — always counts as correct if answered
            if user_val:
                orientation_score += 1.0
            orientation_max += 1
        elif scoring_type == "approximate":
            # Month: exact = 1.0, adjacent = 0.5
            correct_val = _normalize_string(q.get("correct", ""))
            adjacent = [_normalize_string(a) for a in q.get("adjacent", [])]
            if user_val == correct_val:
                orientation_score += 1.0
            elif user_val in adjacent:
                orientation_score += 0.5
            orientation_max += 1
        else:  # exact
            correct_val = _normalize_string(q.get("correct", ""))
            if user_val == correct_val:
                orientation_score += 1.0
            orientation_max += 1
    
    norm_orientation = orientation_score / max(orientation_max, 1)

    # 3. Recall (AI hybrid)
    method = "exact_fallback"
    correct_count = 0
    
    if user_recall.dont_remember:
        correct_count = 0
        method = "no_attempt"
    else:
        try:
            result_map = await AIPreprocessing.evaluate_recall(expected_words, user_recall.response or [])
            correct_count = sum(1 for val in result_map.values() if val is True)
            method = "ai_hybrid"
        except Exception as e:
            logger.error(f"Recall AI fallback: {e}")
            correct_count = _safe_intersection_count(user_recall.response or [], expected_words)

    norm_recall = correct_count / max(len(expected_words), 1)

    level1_score = (norm_ad8 + norm_orientation + norm_recall) / 3.0

    return {
        "normalized_score": round(level1_score, 4),
        "raw_scores": {
            "ad8": ad8_sum,
            "orientation": round(orientation_score, 1),
            "recall": correct_count
        },
        "method": method
    }


# ============================================================
# LEVEL 2 SCORING (5 components, weighted)
# ============================================================

def score_digit_span(expected: str, forward: str, backward: str) -> float:
    """Partial credit position-by-position. Forward 50%, Backward 50%."""
    if not expected or len(expected) == 0:
        return 0.0
    forward_correct = sum(1 for a, b in zip(expected, forward) if a == b)
    forward_score = (forward_correct / len(expected)) * 0.5
    expected_rev = expected[::-1]
    backward_correct = sum(1 for a, b in zip(expected_rev, backward) if a == b)
    backward_score = (backward_correct / len(expected)) * 0.5
    return round(forward_score + backward_score, 4)


def score_visual_recognition(selected: List[str], targets: List[str], distractors: List[str]) -> float:
    """
    Recognition memory scoring with false alarm penalty.
    score = (correct_hits - 0.5 * false_alarms) / total_targets, clamped [0, 1]
    """
    if not targets:
        return 0.0
    selected_set = set(s.lower().strip() for s in selected if s)
    target_set = set(t.lower().strip() for t in targets)
    distractor_set = set(d.lower().strip() for d in distractors)
    
    correct_hits = len(selected_set & target_set)
    false_alarms = len(selected_set & distractor_set)
    
    raw_score = (correct_hits - 0.5 * false_alarms) / len(targets)
    return round(max(0.0, min(1.0, raw_score)), 4)


def score_pattern(selected: str, correct: str) -> float:
    """Binary pattern scoring. 1.0 if correct, 0.0 otherwise."""
    if not selected or not correct:
        return 0.0
    return 1.0 if selected.strip().upper() == correct.strip().upper() else 0.0


async def score_level_2(
    animals_list: List[str],
    fluency_category: str,
    expected_sequence: str, digit_forward: MemoryStringResponse, digit_backward: MemoryStringResponse,
    visual_selected: List[str], vr_targets: List[str], vr_distractors: List[str],
    pattern_answer: str, expected_pattern: str,
    delayed_recall: MemoryListResponse, level1_words: List[str]
) -> Dict[str, Any]:
    """
    Level 2 (MCI) — 5 components with clinical weights:
    - Digit Span:          0.25 (working memory)
    - Delayed Recall:      0.25 (memory decline indicator)
    - Verbal Fluency:      0.20 (language + executive function)
    - Visual Recognition:  0.15 (recognition memory)
    - Pattern Recognition: 0.15 (reasoning)
    """
    # 1. Verbal Fluency (AI hybrid — category-aware)
    method_fluency = "exact_fallback"
    try:
        result_map = await AIPreprocessing.evaluate_category_items(fluency_category, animals_list)
        fluency_count = sum(1 for val in result_map.values() if val is True)
        method_fluency = "ai_hybrid"
    except Exception as e:
        logger.error(f"Fluency AI fallback: {e}")
        unique_items = set(_normalize_string(a) for a in animals_list if a)
        
        from app.ai_services.semantic_validation import SemanticValidator
        cat_lower = fluency_category.lower().strip()
        cat_set = SemanticValidator.CATEGORIES.get(cat_lower, SemanticValidator.CATEGORIES.get("animals", set()))
        
        import difflib
        fluency_count = 0
        for item in unique_items:
            if item in cat_set:
                fluency_count += 1
            else:
                closest = difflib.get_close_matches(item, cat_set, n=1, cutoff=0.8)
                if closest:
                    fluency_count += 1
    norm_fluency = 1.0 if fluency_count >= 14 else fluency_count / 14.0

    # 2. Digit Span (deterministic)
    f_resp = "" if digit_forward.dont_remember else (digit_forward.response or "")
    b_resp = "" if digit_backward.dont_remember else (digit_backward.response or "")
    digit_score = score_digit_span(expected_sequence, f_resp, b_resp)

    # 3. Visual Recognition (deterministic)
    vr_score = score_visual_recognition(visual_selected, vr_targets, vr_distractors)

    # 4. Visual Pattern (deterministic)
    pattern_score = score_pattern(pattern_answer, expected_pattern)

    # 5. Delayed Recall (AI hybrid)
    method_recall = "exact_fallback"
    recall_count = 0
    if delayed_recall.dont_remember:
        recall_count = 0
        method_recall = "no_attempt"
    else:
        try:
            recall_map = await AIPreprocessing.evaluate_recall(level1_words, delayed_recall.response or [])
            recall_count = sum(1 for val in recall_map.values() if val is True)
            method_recall = "ai_hybrid"
        except Exception as e:
            logger.error(f"Delayed Recall AI fallback: {e}")
            recall_count = _safe_intersection_count(delayed_recall.response or [], level1_words)
    norm_recall = recall_count / max(len(level1_words), 1)

    # Weighted Composite
    level2_score = (
        0.25 * digit_score +
        0.25 * norm_recall +
        0.20 * norm_fluency +
        0.15 * vr_score +
        0.15 * pattern_score
    )

    return {
        "normalized_score": round(level2_score, 4),
        "raw_scores": {
            "fluency_count": fluency_count,
            "digit_span": digit_score,
            "visual_recognition": vr_score,
            "pattern_recognition": pattern_score,
            "delayed_recall_count": recall_count
        },
        "method_breakdown": {
            "fluency": method_fluency,
            "digit_span": "deterministic",
            "visual_recognition": "deterministic",
            "pattern_recognition": "deterministic",
            "delayed_recall": method_recall
        }
    }


# ============================================================
# LEVEL 3 SCORING (Stroop Test)
# ============================================================

def score_stroop(trials: list, responses: list) -> Dict[str, Any]:
    """
    Score Stroop Test responses.
    
    Args:
        trials: List of trial dicts with 'color' (correct answer) and 'congruent' keys
        responses: List of response dicts with 'answer', 'reaction_time_ms', 'timed_out' keys
    
    Returns:
        Dict with normalized score (0-1), accuracy metrics, and reaction time stats.
    """
    if not trials or not responses:
        return {
            "normalized_score": 0.0,
            "total_correct": 0,
            "accuracy": 0.0,
            "avg_reaction_time_ms": 0,
            "incongruent_accuracy": 0.0,
            "congruent_accuracy": 0.0
        }
    
    total_correct = 0
    congruent_correct = 0
    congruent_total = 0
    incongruent_correct = 0
    incongruent_total = 0
    reaction_times = []
    
    for i, trial in enumerate(trials):
        if i >= len(responses):
            break
        resp = responses[i]
        
        is_correct = (resp.get("answer", "").upper() == trial.get("color", "").upper()) and not resp.get("timed_out", False)
        
        if is_correct:
            total_correct += 1
        
        if trial.get("congruent"):
            congruent_total += 1
            if is_correct:
                congruent_correct += 1
        else:
            incongruent_total += 1
            if is_correct:
                incongruent_correct += 1
        
        rt = resp.get("reaction_time_ms", 0)
        if rt > 0 and not resp.get("timed_out", False):
            reaction_times.append(rt)
    
    total_trials = len(trials)
    accuracy = total_correct / max(total_trials, 1)
    incongruent_acc = incongruent_correct / max(incongruent_total, 1)
    congruent_acc = congruent_correct / max(congruent_total, 1)
    avg_rt = sum(reaction_times) / max(len(reaction_times), 1)
    
    # Normalized score: 70% accuracy + 30% speed bonus
    # Speed bonus: faster reaction = higher score (capped at 3000ms baseline)
    speed_factor = max(0.0, min(1.0, (3000 - avg_rt) / 3000)) if avg_rt > 0 else 0.0
    normalized_score = (0.7 * accuracy) + (0.3 * speed_factor)
    
    return {
        "normalized_score": round(max(0.0, min(1.0, normalized_score)), 4),
        "total_correct": total_correct,
        "accuracy": round(accuracy * 100, 1),
        "avg_reaction_time_ms": round(avg_rt),
        "incongruent_accuracy": round(incongruent_acc * 100, 1),
        "congruent_accuracy": round(congruent_acc * 100, 1)
    }


# ============================================================
# FINAL COMPOSITE
# ============================================================

def calculate_level3_composite(clock_score: float, stroop_score: float) -> float:
    """L3 = 60% Clock Drawing + 40% Stroop Test"""
    return round(max(0.0, min(1.0, (0.6 * clock_score) + (0.4 * stroop_score))), 4)


def calculate_final_composite(l1: float, l2: float, l3: float) -> float:
    final = (0.2 * l1) + (0.4 * l2) + (0.4 * l3)
    return max(0.0, min(final, 1.0))


"""
Dynamic Test Content Generator — Phase 10 (Anti-Repetition Upgrade)
All cognitive test content is generated here. NO static/hardcoded questions anywhere else.
Every function uses generate-only-if-not-exists guards at the caller level.

Pools are intentionally massive to resist memorization across sessions.
"""

import random
from typing import List, Dict, Any, Optional
from datetime import datetime

# ============================================================
# RECALL WORD POOL — 200+ words, organized by semantic category
# ============================================================

RECALL_WORD_POOL_BY_CATEGORY = {
    "nature": [
        "tree", "leaf", "dirt", "mud", "rain", "snow", "star", "sun", "moon", "sky",
        "cloud", "wind", "lake", "pond", "rock", "hill", "sand", "wave", "grass", "weed"
    ],
    "household": [
        "bed", "door", "roof", "wall", "rug", "desk", "lamp", "cup", "fork", "spoon",
        "knife", "bowl", "pan", "pot", "soap", "sink", "tub", "lock", "key", "clock"
    ],
    "tools": [
        "saw", "axe", "nail", "glue", "tape", "rope", "wire", "box", "bag", "net",
        "hook", "pipe", "plug", "cord", "fan", "pump", "hose", "cart", "jack", "drill"
    ],
    "food": [
        "egg", "milk", "meat", "rice", "corn", "pea", "bean", "nut", "soup", "pie",
        "cake", "bun", "roll", "jam", "salt", "dip", "oil", "tea", "gum", "ice"
    ],
    "animals": [
        "dog", "cat", "cow", "pig", "fox", "bat", "rat", "bug", "ant", "bee",
        "fly", "owl", "jay", "hen", "duck", "frog", "toad", "fish", "worm", "bear"
    ],
    "body": [
        "eye", "ear", "nose", "lip", "chin", "neck", "arm", "leg", "foot", "toe",
        "hand", "back", "hip", "chest", "skin", "bone", "hair", "tooth", "knee", "thumb"
    ],
    "clothing": [
        "hat", "cap", "coat", "suit", "sock", "shoe", "boot", "belt", "tie", "bow",
        "ring", "gown", "robe", "cape", "mask", "veil", "zip", "tag", "pad", "scarf"
    ],
    "transport": [
        "car", "bus", "van", "cab", "jet", "ship", "boat", "raft", "bike", "tram",
        "train", "jeep", "tube", "sled", "wing", "tire", "seat", "helm", "sail", "mast"
    ],
    "music": [
        "drum", "horn", "bell", "gong", "lute", "song", "tune", "note", "beat", "band",
        "hum", "clap", "snap", "tap", "string", "reed", "fret", "mic", "harp", "flute"
    ],
    "objects": [
        "toy", "ball", "doll", "top", "coin", "map", "pen", "ink", "book", "card",
        "jar", "can", "lid", "gem", "seal", "wand", "dart", "dice", "kite", "tray"
    ]
}

# Flattened pool for backward compatibility
RECALL_WORD_POOL = []
for _cat_words in RECALL_WORD_POOL_BY_CATEGORY.values():
    RECALL_WORD_POOL.extend(_cat_words)

# ============================================================
# VISUAL OBJECT POOL — 60+ emoji objects
# ============================================================

VISUAL_OBJECTS = [
    # Original 22
    {"id": "apple", "emoji": "🍎", "label": "Apple"},
    {"id": "dog", "emoji": "🐕", "label": "Dog"},
    {"id": "chair", "emoji": "🪑", "label": "Chair"},
    {"id": "clock", "emoji": "🕐", "label": "Clock"},
    {"id": "book", "emoji": "📖", "label": "Book"},
    {"id": "car", "emoji": "🚗", "label": "Car"},
    {"id": "tree", "emoji": "🌳", "label": "Tree"},
    {"id": "house", "emoji": "🏠", "label": "House"},
    {"id": "fish", "emoji": "🐟", "label": "Fish"},
    {"id": "star", "emoji": "⭐", "label": "Star"},
    {"id": "key", "emoji": "🔑", "label": "Key"},
    {"id": "hat", "emoji": "🎩", "label": "Hat"},
    {"id": "cup", "emoji": "☕", "label": "Cup"},
    {"id": "bell", "emoji": "🔔", "label": "Bell"},
    {"id": "shoe", "emoji": "👟", "label": "Shoe"},
    {"id": "moon", "emoji": "🌙", "label": "Moon"},
    {"id": "sun", "emoji": "☀️", "label": "Sun"},
    {"id": "flower", "emoji": "🌺", "label": "Flower"},
    {"id": "cat", "emoji": "🐱", "label": "Cat"},
    {"id": "bicycle", "emoji": "🚲", "label": "Bicycle"},
    {"id": "umbrella", "emoji": "☂️", "label": "Umbrella"},
    {"id": "guitar", "emoji": "🎸", "label": "Guitar"},
    # Expanded — vehicles
    {"id": "airplane", "emoji": "✈️", "label": "Airplane"},
    {"id": "bus", "emoji": "🚌", "label": "Bus"},
    {"id": "train", "emoji": "🚂", "label": "Train"},
    {"id": "boat", "emoji": "⛵", "label": "Boat"},
    {"id": "rocket", "emoji": "🚀", "label": "Rocket"},
    # Expanded — food
    {"id": "banana", "emoji": "🍌", "label": "Banana"},
    {"id": "pizza", "emoji": "🍕", "label": "Pizza"},
    {"id": "cake", "emoji": "🎂", "label": "Cake"},
    {"id": "watermelon", "emoji": "🍉", "label": "Watermelon"},
    {"id": "grapes", "emoji": "🍇", "label": "Grapes"},
    {"id": "carrot", "emoji": "🥕", "label": "Carrot"},
    # Expanded — weather/nature
    {"id": "rainbow", "emoji": "🌈", "label": "Rainbow"},
    {"id": "snowflake", "emoji": "❄️", "label": "Snowflake"},
    {"id": "cloud", "emoji": "☁️", "label": "Cloud"},
    {"id": "lightning", "emoji": "⚡", "label": "Lightning"},
    {"id": "volcano_obj", "emoji": "🌋", "label": "Volcano"},
    # Expanded — tools/objects
    {"id": "scissors", "emoji": "✂️", "label": "Scissors"},
    {"id": "hammer_obj", "emoji": "🔨", "label": "Hammer"},
    {"id": "magnifier", "emoji": "🔍", "label": "Magnifier"},
    {"id": "lock", "emoji": "🔒", "label": "Lock"},
    {"id": "envelope", "emoji": "✉️", "label": "Envelope"},
    {"id": "pencil_obj", "emoji": "✏️", "label": "Pencil"},
    # Expanded — animals
    {"id": "elephant", "emoji": "🐘", "label": "Elephant"},
    {"id": "penguin_obj", "emoji": "🐧", "label": "Penguin"},
    {"id": "butterfly", "emoji": "🦋", "label": "Butterfly"},
    {"id": "turtle_obj", "emoji": "🐢", "label": "Turtle"},
    {"id": "rabbit_obj", "emoji": "🐰", "label": "Rabbit"},
    {"id": "whale", "emoji": "🐳", "label": "Whale"},
    # Expanded — sports/activities
    {"id": "soccer", "emoji": "⚽", "label": "Soccer Ball"},
    {"id": "basketball", "emoji": "🏀", "label": "Basketball"},
    {"id": "tennis", "emoji": "🎾", "label": "Tennis Ball"},
    {"id": "trophy_obj", "emoji": "🏆", "label": "Trophy"},
    # Expanded — music
    {"id": "piano", "emoji": "🎹", "label": "Piano"},
    {"id": "drum", "emoji": "🥁", "label": "Drum"},
    {"id": "violin_obj", "emoji": "🎻", "label": "Violin"},
    # Expanded — buildings/places
    {"id": "hospital", "emoji": "🏥", "label": "Hospital"},
    {"id": "school", "emoji": "🏫", "label": "School"},
    {"id": "castle_obj", "emoji": "🏰", "label": "Castle"},
    # Expanded — clothing
    {"id": "glasses", "emoji": "👓", "label": "Glasses"},
    {"id": "crown", "emoji": "👑", "label": "Crown"},
    {"id": "watch", "emoji": "⌚", "label": "Watch"},
]

# ============================================================
# VISUAL PATTERN SYMBOLS & TYPES — expanded
# ============================================================

PATTERN_SYMBOLS = [
    "🔴", "🔵", "🟢", "🟡", "🟣", "🔺", "🔷", "⭐",
    "🟩", "🟨", "🟦", "🟥", "🔶", "🟤", "⬛", "⬜",
    "🔸", "🔹", "💠", "♦️", "♠️", "🔘"
]

PATTERN_TYPES = ["alternating", "repeating", "growing", "ascending", "mirror", "skip"]

# ============================================================
# ORIENTATION POOLS — expanded to 6 question types
# ============================================================

MONTHS_ALL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

DAYS_ALL = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

SEASONS_ALL = ["Spring", "Summer", "Autumn", "Winter"]

LOCATION_OPTIONS = ["Home", "Hospital", "Clinic", "Outside", "Office", "School", "Park", "Other"]
TIME_OF_DAY_OPTIONS = ["Morning", "Afternoon", "Evening", "Night"]

# ============================================================
# VERBAL FLUENCY CATEGORIES
# ============================================================

FLUENCY_CATEGORIES = ["animals", "fruits", "objects", "vegetables", "occupations"]


# ============================================================
# GENERATORS
# ============================================================

def generate_recall_words(count: int = 3, exclude: Optional[List[str]] = None) -> List[str]:
    """Pick `count` random words from the pool, avoiding any in `exclude`.
    Tries to pick from different categories for diversity."""
    exclude_set = set(exclude or [])
    available = [w for w in RECALL_WORD_POOL if w not in exclude_set]
    if len(available) < count:
        available = RECALL_WORD_POOL[:]  # Reset if pool exhausted
    return random.sample(available, count)


def _get_time_of_day(hour: int) -> str:
    """Determine time of day from hour (0-23)."""
    if 5 <= hour < 12:
        return "Morning"
    elif 12 <= hour < 17:
        return "Afternoon"
    elif 17 <= hour < 21:
        return "Evening"
    else:
        return "Night"


def _get_season(month: int) -> str:
    """Determine season from month (1-12). Northern hemisphere."""
    if month in (3, 4, 5):
        return "Spring"
    elif month in (6, 7, 8):
        return "Summer"
    elif month in (9, 10, 11):
        return "Autumn"
    else:
        return "Winter"


def _get_day_of_week() -> str:
    """Get current day of week as a string."""
    return DAYS_ALL[datetime.now().weekday()]


def _shuffle_with_correct(correct: str, pool: List[str], total: int = 4) -> List[str]:
    """Build a list of `total` options containing `correct` + random distractors from `pool`."""
    distractors = [x for x in pool if x != correct]
    chosen = random.sample(distractors, min(total - 1, len(distractors)))
    options = [correct] + chosen
    random.shuffle(options)
    return options


def generate_orientation_questions(local_hour: int = None, pick_count: int = 4) -> List[Dict[str, Any]]:
    """
    Generate orientation questions with randomized options from a pool of 6 possible types.
    Picks `pick_count` questions randomly from the full pool for variety.
    `local_hour` is the user's local hour (0-23) for time-of-day question.
    """
    now = datetime.now()
    current_year = str(now.year)
    current_month = MONTHS_ALL[now.month - 1]
    current_day = _get_day_of_week()
    current_season = _get_season(now.month)

    if local_hour is None:
        local_hour = now.hour
    correct_tod = _get_time_of_day(local_hour)

    # Year options: current ± 2
    year_options = _shuffle_with_correct(
        current_year,
        [str(now.year - 2), str(now.year - 1), str(now.year + 1), str(now.year + 2)],
        4
    )

    # Month options: correct + 3 random others
    month_pool = [m for m in MONTHS_ALL if m != current_month]
    month_distractors = random.sample(month_pool, 3)
    month_options = [current_month] + month_distractors
    random.shuffle(month_options)

    # Adjacent months for approximate scoring
    month_idx = MONTHS_ALL.index(current_month)
    adjacent_months = []
    if month_idx > 0:
        adjacent_months.append(MONTHS_ALL[month_idx - 1])
    if month_idx < 11:
        adjacent_months.append(MONTHS_ALL[month_idx + 1])

    # Time of day: all 4 options, shuffled
    tod_options = TIME_OF_DAY_OPTIONS[:]
    random.shuffle(tod_options)

    # Location: shuffled (self-report)
    loc_options = random.sample(LOCATION_OPTIONS, min(4, len(LOCATION_OPTIONS)))

    # Day of week options
    day_pool = [d for d in DAYS_ALL if d != current_day]
    day_distractors = random.sample(day_pool, 3)
    day_options = [current_day] + day_distractors
    random.shuffle(day_options)

    # Season options
    season_options = SEASONS_ALL[:]
    random.shuffle(season_options)

    # Full pool of 6 question types
    all_questions = [
        {
            "id": "year",
            "label": "What year is it?",
            "correct": current_year,
            "options": year_options,
            "scoring": "exact"
        },
        {
            "id": "month",
            "label": "What month is it?",
            "correct": current_month,
            "adjacent": adjacent_months,
            "options": month_options,
            "scoring": "approximate"
        },
        {
            "id": "time_of_day",
            "label": "What time of day is it?",
            "correct": correct_tod,
            "options": tod_options,
            "scoring": "exact"
        },
        {
            "id": "location",
            "label": "Where are you right now?",
            "options": loc_options,
            "scoring": "self_report"
        },
        {
            "id": "day_of_week",
            "label": "What day of the week is it?",
            "correct": current_day,
            "options": day_options,
            "scoring": "exact"
        },
        {
            "id": "season",
            "label": "What season is it currently?",
            "correct": current_season,
            "options": season_options,
            "scoring": "exact"
        }
    ]

    # Pick a subset for variety (always include year and month for clinical validity)
    mandatory = [q for q in all_questions if q["id"] in ("year", "month")]
    optional = [q for q in all_questions if q["id"] not in ("year", "month")]
    remaining_count = max(0, pick_count - len(mandatory))
    picked_optional = random.sample(optional, min(remaining_count, len(optional)))

    selected = mandatory + picked_optional
    random.shuffle(selected)

    return selected


def generate_digit_span(difficulty_offset: int = 0, exclude_sequences: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Generate a random digit span sequence with variable length.
    Base length: 4, range: 3-6.
    """
    length = max(3, min(6, 4 + difficulty_offset))
    exclude_set = set(exclude_sequences or [])

    # Try up to 20 attempts to avoid reuse
    for _ in range(20):
        sequence = "".join([str(random.randint(1, 9)) for _ in range(length)])
        if sequence not in exclude_set:
            return {"expected": sequence, "length": length}

    # Fallback: return whatever we have
    sequence = "".join([str(random.randint(1, 9)) for _ in range(length)])
    return {"expected": sequence, "length": length}


def generate_visual_recognition(target_count: int = 4, distractor_count: int = 2, exclude_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Select target objects + distractors for visual recognition test.
    Returns targets (to show during encoding) and the full mixed set (for recognition).
    """
    available = [obj for obj in VISUAL_OBJECTS if obj["id"] not in (exclude_ids or [])]
    needed = target_count + distractor_count
    if len(available) < needed:
        available = VISUAL_OBJECTS[:]

    selected = random.sample(available, needed)
    targets = selected[:target_count]
    distractors = selected[target_count:]

    # Build mixed set (shuffled) for recognition phase
    mixed = targets[:] + distractors[:]
    random.shuffle(mixed)

    # Display duration: 6s for 3-4 items, 8s for 5+
    display_duration = 6000 if target_count <= 4 else 8000

    return {
        "targets": [{"id": t["id"], "emoji": t["emoji"], "label": t["label"]} for t in targets],
        "distractors": [{"id": d["id"], "emoji": d["emoji"], "label": d["label"]} for d in distractors],
        "mixed_set": [{"id": m["id"], "emoji": m["emoji"], "label": m["label"]} for m in mixed],
        "display_duration": display_duration
    }


def generate_visual_pattern(exclude_type: Optional[str] = None, exclude_types: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Generate a non-numeric visual pattern question using shapes/icons.
    Supports: alternating, repeating, growing, ascending, mirror, skip.
    """
    # Build exclusion set from both params
    type_exclusions = set()
    if exclude_type:
        type_exclusions.add(exclude_type)
    if exclude_types:
        type_exclusions.update(exclude_types)

    available_types = [t for t in PATTERN_TYPES if t not in type_exclusions]
    if not available_types:
        available_types = PATTERN_TYPES[:]  # Reset if all excluded

    pattern_type = random.choice(available_types)

    generators = {
        "alternating": _gen_alternating_pattern,
        "repeating": _gen_repeating_pattern,
        "growing": _gen_growing_pattern,
        "ascending": _gen_ascending_pattern,
        "mirror": _gen_mirror_pattern,
        "skip": _gen_skip_pattern,
    }

    return generators[pattern_type]()


def _gen_alternating_pattern() -> Dict[str, Any]:
    """A B A B ? → A"""
    symbols = random.sample(PATTERN_SYMBOLS, 4)
    a, b = symbols[0], symbols[1]
    sequence = [a, b, a, b]
    correct = a
    distractors = [s for s in symbols if s != correct][:3]

    options_list = [correct] + distractors
    random.shuffle(options_list)
    options = {chr(65 + i): v for i, v in enumerate(options_list)}
    correct_key = [k for k, v in options.items() if v == correct][0]

    return {
        "type": "alternating",
        "instruction": "What comes next?",
        "sequence": sequence,
        "options": options,
        "correct": correct_key
    }


def _gen_repeating_pattern() -> Dict[str, Any]:
    """A B C A B ? → C"""
    symbols = random.sample(PATTERN_SYMBOLS, 5)
    a, b, c = symbols[0], symbols[1], symbols[2]
    sequence = [a, b, c, a, b]
    correct = c
    distractors = [s for s in symbols if s != correct][:3]

    options_list = [correct] + distractors
    random.shuffle(options_list)
    options = {chr(65 + i): v for i, v in enumerate(options_list)}
    correct_key = [k for k, v in options.items() if v == correct][0]

    return {
        "type": "repeating",
        "instruction": "What comes next?",
        "sequence": sequence,
        "options": options,
        "correct": correct_key
    }


def _gen_growing_pattern() -> Dict[str, Any]:
    """⭐ ⭐⭐ ⭐⭐⭐ ? → ⭐⭐⭐⭐"""
    symbol = random.choice(PATTERN_SYMBOLS)
    sequence = [symbol * i for i in range(1, 4)]
    correct = symbol * 4

    distractors = [symbol * 3, symbol * 5, symbol * 2]

    options_list = [correct] + distractors
    random.shuffle(options_list)
    options = {chr(65 + i): v for i, v in enumerate(options_list)}
    correct_key = [k for k, v in options.items() if v == correct][0]

    return {
        "type": "growing",
        "instruction": "What comes next?",
        "sequence": sequence,
        "options": options,
        "correct": correct_key
    }


def _gen_ascending_pattern() -> Dict[str, Any]:
    """A AA AAA AAAA ? → AAAAA (count-based with different symbol)"""
    symbols = random.sample(PATTERN_SYMBOLS, 4)
    symbol = symbols[0]
    # Show 1, 2, 3 → answer is 4
    sequence = [symbol * i for i in range(1, 4)]
    correct = symbol * 4

    # Distractors: wrong counts or wrong symbols
    distractors = [symbol * 5, symbol * 3, symbols[1] * 4]

    options_list = [correct] + distractors
    random.shuffle(options_list)
    options = {chr(65 + i): v for i, v in enumerate(options_list)}
    correct_key = [k for k, v in options.items() if v == correct][0]

    return {
        "type": "ascending",
        "instruction": "What comes next in the count?",
        "sequence": sequence,
        "options": options,
        "correct": correct_key
    }


def _gen_mirror_pattern() -> Dict[str, Any]:
    """A B C B ? → A"""
    symbols = random.sample(PATTERN_SYMBOLS, 5)
    a, b, c = symbols[0], symbols[1], symbols[2]
    sequence = [a, b, c, b]
    correct = a
    distractors = [s for s in symbols if s != correct][:3]

    options_list = [correct] + distractors
    random.shuffle(options_list)
    options = {chr(65 + i): v for i, v in enumerate(options_list)}
    correct_key = [k for k, v in options.items() if v == correct][0]

    return {
        "type": "mirror",
        "instruction": "This pattern mirrors itself. What comes next?",
        "sequence": sequence,
        "options": options,
        "correct": correct_key
    }


def _gen_skip_pattern() -> Dict[str, Any]:
    """A X B X ? → A  (alternating with spacer)"""
    symbols = random.sample(PATTERN_SYMBOLS, 5)
    a, b, spacer = symbols[0], symbols[1], symbols[2]
    sequence = [a, spacer, b, spacer]
    # The pattern alternates: a, b then restarts → a
    correct = a
    distractors = [s for s in symbols if s != correct][:3]

    options_list = [correct] + distractors
    random.shuffle(options_list)
    options = {chr(65 + i): v for i, v in enumerate(options_list)}
    correct_key = [k for k, v in options.items() if v == correct][0]

    return {
        "type": "skip",
        "instruction": "Ignoring the spacer, what comes next?",
        "sequence": sequence,
        "options": options,
        "correct": correct_key
    }


def generate_fluency_category(exclude_categories: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Select a random verbal fluency category, avoiding recently used ones.
    """
    available = [c for c in FLUENCY_CATEGORIES if c not in (exclude_categories or [])]
    if not available:
        available = FLUENCY_CATEGORIES[:]

    category = random.choice(available)
    return {
        "category": category,
        "time_limit_seconds": 60,
        "instruction": f"Name as many {category} as you can in 60 seconds."
    }


# ============================================================
# STROOP TEST GENERATOR
# ============================================================

STROOP_COLORS = [
    {"name": "RED", "hex": "#DC3545"},
    {"name": "BLUE", "hex": "#0D6EFD"},
    {"name": "GREEN", "hex": "#198754"},
    {"name": "YELLOW", "hex": "#FFC107"},
]

def generate_stroop_trials(total: int = 7, incongruent_ratio: float = 0.71, time_limit_ms: int = 5000) -> Dict[str, Any]:
    """
    Generate Stroop Test trials for Level 3.
    """
    color_names = [c["name"] for c in STROOP_COLORS]
    color_map = {c["name"]: c["hex"] for c in STROOP_COLORS}

    num_incongruent = int(total * incongruent_ratio)
    num_congruent = total - num_incongruent

    trials = []

    for _ in range(num_congruent):
        color = random.choice(color_names)
        trials.append({
            "word": color,
            "color": color,
            "color_hex": color_map[color],
            "congruent": True
        })

    for _ in range(num_incongruent):
        word = random.choice(color_names)
        other_colors = [c for c in color_names if c != word]
        color = random.choice(other_colors)
        trials.append({
            "word": word,
            "color": color,
            "color_hex": color_map[color],
            "congruent": False
        })

    random.shuffle(trials)

    for i, trial in enumerate(trials):
        trial["index"] = i

    return {
        "trials": trials,
        "total": total,
        "time_limit_ms": time_limit_ms,
        "color_options": STROOP_COLORS
    }


"""
Anti-Repetition Engine — Phase 10
Tracks per-user test history across sessions to prevent content reuse.
Queries completed assessment metadata to build exclusion lists.
Uses LRU eviction when pools are close to exhaustion.
"""

import logging
from typing import Dict, Any, List, Optional
from app.database import supabase_admin

logger = logging.getLogger(__name__)

# How many past sessions to scan for anti-repetition
MAX_HISTORY_SCAN = 5

# If exclusion set exceeds this fraction of the pool, use LRU eviction
LRU_THRESHOLD = 0.7


class AntiRepetitionEngine:
    """
    Central anti-repetition tracker.
    Works by aggregating 'used' metadata from past assessments.
    """

    @staticmethod
    def get_user_history(user_id: str, max_sessions: int = MAX_HISTORY_SCAN) -> Dict[str, Any]:
        """
        Fetch aggregated usage history from a user's past completed assessments.
        Returns structured history of all items used recently.
        """
        try:
            res = (
                supabase_admin.table("assessments")
                .select("metadata")
                .eq("user_id", user_id)
                .eq("status", "completed")
                .order("started_at", desc=True)
                .limit(max_sessions)
                .execute()
            )
            
            history = {
                "recall_words": [],
                "visual_objects": [],
                "pattern_types": [],
                "fluency_categories": [],
                "digit_sequences": [],
            }
            
            for row in (res.data or []):
                metadata = row.get("metadata") or {}
                used = metadata.get("used", {})
                
                # Recall words
                words = used.get("recall_words", [])
                if words:
                    history["recall_words"].extend(words)
                
                # Visual objects
                objects = used.get("visual_objects", [])
                if objects:
                    history["visual_objects"].extend(objects)
                
                # Pattern types
                ptype = used.get("pattern_type")
                if ptype:
                    history["pattern_types"].append(ptype)
                
                # Fluency categories
                fcat = used.get("fluency_category")
                if fcat:
                    history["fluency_categories"].append(fcat)
                
                # Digit sequences
                digit_data = metadata.get("digit_span", {})
                seq = digit_data.get("expected")
                if seq:
                    history["digit_sequences"].append(seq)
            
            return history
            
        except Exception as e:
            logger.error(f"Failed to fetch user history: {e}")
            return {
                "recall_words": [],
                "visual_objects": [],
                "pattern_types": [],
                "fluency_categories": [],
                "digit_sequences": [],
            }

    @staticmethod
    def get_exclusion_lists(user_id: str, pool_sizes: Optional[Dict[str, int]] = None) -> Dict[str, List[str]]:
        """
        Build exclusion lists for the next assessment.
        Applies LRU eviction if exclusion would exhaust pool.
        
        Args:
            user_id: The user's ID
            pool_sizes: Optional dict mapping pool name to total size (for LRU threshold calc)
        
        Returns:
            Dict with exclusion lists per test type.
        """
        history = AntiRepetitionEngine.get_user_history(user_id)
        
        defaults = {
            "recall_words": 200,
            "visual_objects": 60,
        }
        if pool_sizes:
            defaults.update(pool_sizes)
        
        exclusions = {}
        
        # Recall words — exclude if not exhausting pool
        recall_used = list(set(history.get("recall_words", [])))
        if len(recall_used) > defaults["recall_words"] * LRU_THRESHOLD:
            # LRU eviction: keep only the most recent half
            recall_used = recall_used[:len(recall_used) // 2]
            logger.info(f"LRU eviction for recall words: reduced to {len(recall_used)}")
        exclusions["recall_words"] = recall_used
        
        # Visual objects
        visual_used = list(set(history.get("visual_objects", [])))
        if len(visual_used) > defaults["visual_objects"] * LRU_THRESHOLD:
            visual_used = visual_used[:len(visual_used) // 2]
            logger.info(f"LRU eviction for visual objects: reduced to {len(visual_used)}")
        exclusions["visual_objects"] = visual_used
        
        # Pattern types — just the last 2
        pattern_types = history.get("pattern_types", [])
        exclusions["pattern_types"] = pattern_types[:2] if len(pattern_types) >= 2 else pattern_types
        
        # Fluency categories — last 2
        fluency_cats = history.get("fluency_categories", [])
        exclusions["fluency_categories"] = fluency_cats[:2] if len(fluency_cats) >= 2 else fluency_cats
        
        # Digit sequences — last 3
        digit_seqs = history.get("digit_sequences", [])
        exclusions["digit_sequences"] = digit_seqs[:3] if len(digit_seqs) >= 3 else digit_seqs
        
        return exclusions

    @staticmethod
    def record_session_usage(assessment_id: str, user_id: str, usage: Dict[str, Any]) -> None:
        """
        Update the assessment metadata with usage tracking data.
        Called after all test content for a level has been generated.
        Merges new usage into existing 'used' key.
        """
        try:
            res = (
                supabase_admin.table("assessments")
                .select("metadata")
                .eq("id", assessment_id)
                .eq("user_id", user_id)
                .execute()
            )
            
            if not res.data:
                logger.error(f"Cannot record usage: assessment {assessment_id} not found")
                return
            
            metadata = res.data[0].get("metadata") or {}
            existing_used = metadata.get("used", {})
            
            # Merge: append lists, overwrite scalars
            for key, value in usage.items():
                if isinstance(value, list):
                    existing = existing_used.get(key, [])
                    merged = list(set(existing + value))
                    existing_used[key] = merged
                else:
                    existing_used[key] = value
            
            metadata["used"] = existing_used
            
            supabase_admin.table("assessments").update(
                {"metadata": metadata}
            ).eq("id", assessment_id).eq("user_id", user_id).execute()
            
        except Exception as e:
            logger.error(f"Failed to record session usage: {e}")


def determine_risk(cognitive_score: float) -> dict:
    """
    Deterministically maps a final normalized cognitive score to a risk band.
    Purity: No database or external dependencies.
    """
    # Defensive clamp
    cognitive_score = max(0.0, min(cognitive_score, 1.0))
    
    # Invert to generate risk
    risk_score = 1.0 - cognitive_score

    if risk_score <= 0.25:
        band = "low"
        rec = "Monitor annually and maintain healthy habits."
    elif risk_score <= 0.60:
        band = "moderate"
        rec = "Re-test in 3-6 months. Consult a physician."
    else:
        band = "high"
        rec = "Consult a neurologist immediately for a formal evaluation."

    return {
        "risk_score": round(risk_score, 4),
        "risk_band": band,
        "recommendation": rec
    }
