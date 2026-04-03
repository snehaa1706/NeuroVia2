from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, Depends, Query
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user
from app.models.cognitive import (
    SessionStartRequest,
    TestSubmissionRequest,
    CognitiveSessionResponse,
    CognitiveResultResponse,
    CognitiveSummaryResponse
)
import app.services.cognitive_service as cognitive_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/start", response_model=CognitiveSessionResponse)
async def start_cognitive_session(
    payload: SessionStartRequest,
    user: dict = Depends(get_current_user)
):
    """Start a new cognitive testing session."""
    data = cognitive_service.start_session(user["id"], payload)
    return CognitiveSessionResponse(**data)


@router.post("/{session_id}/submit", response_model=CognitiveResultResponse)
@limiter.limit("10/minute")
async def submit_cognitive_test(
    request: Request,
    session_id: str,
    payload: TestSubmissionRequest,
    user: dict = Depends(get_current_user)
):
    """Submit responses to a cognitive test session."""
    data = cognitive_service.submit_test(user["id"], session_id, payload)
    return CognitiveResultResponse(**data)


@router.get("/history", response_model=List[CognitiveResultResponse])
async def get_cognitive_history(
    user: dict = Depends(get_current_user)
):
    """Fetch history of cognitive test results."""
    data = cognitive_service.get_cognitive_history(user, user["id"])
    return [CognitiveResultResponse(**d) for d in data]


@router.get("/summary", response_model=CognitiveSummaryResponse)
async def get_cognitive_summary(
    user: dict = Depends(get_current_user)
):
    """Fetch aggregated insights from cognitive test results."""
    data = cognitive_service.compute_cognitive_summary(user["id"])
    return CognitiveSummaryResponse(**data)
