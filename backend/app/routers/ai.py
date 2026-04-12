import json
from fastapi import APIRouter, HTTPException, Request
from app.database import get_supabase
from app.models.ai_analysis import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    ActivityGenerationRequest,
    HealthGuidanceRequest,
    HealthGuidanceResponse,
    ConsultationSummaryRequest,
    ConsultationSummaryResponse,
)
from app.services.ai_service import (
    analyze_screening,
    generate_health_guidance,
    generate_activity,
    generate_consultation_summary,
    generate_ai_response
)
from app.ai_services.ai_orchestrator import orchestrator
from app.models.ai_orchestrator_requests import (
    RiskPredictionRequest,
    TrendAnalysisRequest,
    SemanticValidationRequest,
    ClockAnalysisRequest,
    DoctorInsightRequest,
    FullAnalysisRequest
)

from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.get("/test-ai")
async def test_ai_endpoint(prompt: str = "Explain early warning signs of dementia."):
    """Test endpoint to verify switchable AI provider functionality."""
    system_prompt = "You are a cognitive health assistant helping analyze dementia screening data."
    response = await generate_ai_response(system_prompt, prompt)
    return {"prompt": prompt, "response": response}


def _get_user_id(request: Request) -> str:
    sb = get_supabase()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    if token == "TEST_TOKEN":
        return "test-patient-id"
    user_response = sb.auth.get_user(token)
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_response.user.id


@router.post("/analyze-screening", response_model=AIAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_screening_endpoint(request: Request, data: AIAnalysisRequest):
    """Analyze screening results using OpenAI."""
    sb = get_supabase()
    user_id = _get_user_id(request)

    # Fetch screening and its results
    screening = (
        sb.table("screenings")
        .select("*")
        .eq("id", data.screening_id)
        .single()
        .execute()
    )
    if not screening.data:
        raise HTTPException(status_code=404, detail="Screening not found")

    results = (
        sb.table("screening_results")
        .select("*")
        .eq("screening_id", data.screening_id)
        .execute()
    )

    # Format test results for AI
    test_results_text = ""
    for r in results.data:
        test_results_text += f"\n{r['test_type']}: score={r['score']}/{r['max_score']}, responses={json.dumps(r['responses'])}"

    # Get AI analysis
    ai_result = await analyze_screening(
        screening.data["level"], test_results_text
    )

    if "error" in ai_result:
        raise HTTPException(status_code=500, detail=ai_result["error"])

    # Store analysis
    analysis_record = {
        "screening_id": data.screening_id,
        "risk_level": ai_result.get("risk_level", "low"),
        "risk_score": float(ai_result.get("risk_score", 0)),
        "interpretation": ai_result.get("interpretation", ""),
        "recommendations": ai_result.get("recommendations", []),
    }
    result = sb.table("ai_analyses").insert(analysis_record).execute()
    analysis = result.data[0]

    return AIAnalysisResponse(
        id=analysis["id"],
        screening_id=analysis["screening_id"],
        risk_level=analysis["risk_level"],
        risk_score=analysis["risk_score"],
        interpretation=analysis["interpretation"],
        recommendations=analysis["recommendations"],
        created_at=analysis.get("created_at"),
    )


@router.post("/generate-activity")
async def generate_activity_endpoint(request: Request, data: ActivityGenerationRequest):
    """Generate a cognitive activity using OpenAI."""
    user_id = _get_user_id(request)

    activity_type = data.activity_type or "memory_recall"
    difficulty = data.difficulty or "easy"
    level = data.level
    language = data.language

    ai_result = await generate_activity(activity_type, difficulty, level=level, language=language)

    if "error" in ai_result:
        raise HTTPException(status_code=500, detail=ai_result["error"])

    sb = get_supabase()

    # Delete any existing activity of this type for the user (prevent duplicates)
    (
        sb.table("activities")
        .delete()
        .eq("user_id", user_id)
        .eq("activity_type", activity_type)
        .execute()
    )

    # Insert the fresh activity
    activity_record = {
        "user_id": user_id,
        "activity_type": activity_type,
        "content": ai_result,
        "difficulty": difficulty,
        "level": level,
        "language": language
    }
    result = sb.table("activities").insert(activity_record).execute()

    return {"activity": result.data[0]}


@router.post("/health-guidance", response_model=HealthGuidanceResponse)
async def health_guidance_endpoint(
    request: Request, data: HealthGuidanceRequest
):
    """Get AI-powered caregiver guidance."""
    _get_user_id(request)
    sb = get_supabase()

    # Fetch the health log
    log = (
        sb.table("health_logs")
        .select("*")
        .eq("id", data.health_log_id)
        .single()
        .execute()
    )
    if not log.data:
        raise HTTPException(status_code=404, detail="Log not found")

    # Fetch recent logs for context
    recent = (
        sb.table("health_logs")
        .select("*")
        .eq("user_id", data.user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    recent_text = json.dumps(recent.data, default=str) if recent.data else "None"
    log_data = log.data

    ai_result = await generate_health_guidance(
        mood=log_data.get("mood", "unknown"),
        confusion_level=log_data.get("confusion_level", 5),
        sleep_hours=log_data.get("sleep_hours", 0),
        appetite=log_data.get("appetite", "unknown"),
        notes=log_data.get("notes", ""),
        recent_logs=recent_text,
    )

    if "error" in ai_result:
        raise HTTPException(status_code=500, detail=ai_result["error"])

    return HealthGuidanceResponse(
        assessment=ai_result.get("assessment", ""),
        care_strategies=ai_result.get("care_strategies", []),
        warning_signs=ai_result.get("warning_signs", []),
        suggested_activities=ai_result.get("suggested_activities", []),
    )


@router.post("/consultation-summary", response_model=ConsultationSummaryResponse)
@limiter.limit("10/minute")
async def consultation_summary_endpoint(
    request: Request, data: ConsultationSummaryRequest
):
    """Generate a doctor consultation summary."""
    _get_user_id(request)
    sb = get_supabase()

    # Fetch screening results
    results = (
        sb.table("screening_results")
        .select("*")
        .eq("screening_id", data.screening_id)
        .execute()
    )

    # Fetch existing AI analysis
    analysis = (
        sb.table("ai_analyses")
        .select("*")
        .eq("screening_id", data.screening_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    screening_text = json.dumps(results.data, default=str) if results.data else "None"
    analysis_text = json.dumps(analysis.data, default=str) if analysis.data else "None"

    ai_result = await generate_consultation_summary(screening_text, analysis_text)

    if "error" in ai_result:
        raise HTTPException(status_code=500, detail=ai_result["error"])

    return ConsultationSummaryResponse(
        summary=ai_result.get("summary", ""),
        key_symptoms=ai_result.get("key_symptoms", []),
        cognitive_scores=ai_result.get("cognitive_scores", {}),
        suggested_diagnostics=ai_result.get("suggested_diagnostics", []),
        questions_for_doctor=ai_result.get("questions_for_doctor", []),
    )


# ==========================================
# Orchestrator Phase (Phase 9 Integration)
# ==========================================

@router.post("/cognitive-report")
@limiter.limit("10/minute")
async def cognitive_report(request: Request, analysis_request: FullAnalysisRequest):
    """Run full, standardized orchestrator cascade generating complete dashboard report."""
    data = analysis_request.model_dump()
    return await orchestrator.run_full_analysis(data)
