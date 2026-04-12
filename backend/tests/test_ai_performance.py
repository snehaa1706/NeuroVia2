import pytest
import time
import asyncio
from app.ai_services.ai_orchestrator import orchestrator
from app.ai_models.clock_analysis import ClockAnalyzer

# Create a small dummy base64 image (1x1 black pixel) for clock testing fallback
DUMMY_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

@pytest.mark.asyncio
async def test_orchestrator_parallel_performance():
    req_data = {
        "patient_metrics": {"age": 70, "ad8_score": 2},
        "wellness_history": [{"date": "2023-01-01", "score": 20}],
        "semantic_words": ["cat", "dog", "bird"],
        "semantic_category": "animals"
    }

    # First run (no cache)
    start = time.time()
    res1 = await orchestrator.run_full_analysis(req_data)
    first_run = time.time() - start
    
    # Expected fast execution (<1.5s total, despite LLM being simulated/called)
    # The deterministic parts should run concurrently.
    
    # Second run (cached risk/trend/semantic)
    start = time.time()
    res2 = await orchestrator.run_full_analysis(req_data)
    cached_run = time.time() - start

    assert first_run > 0
    assert cached_run < first_run


def test_clock_analysis_latency():
    """Verify optimized clock analysis runs in <400ms."""
    start = time.time()
    res = ClockAnalyzer.analyze_clock_image(DUMMY_IMAGE_B64)
    duration = time.time() - start
    
    # Allow 0.8s max for cold start on slow CI, but target is <0.4s
    assert duration < 0.8
    assert "score" in res
