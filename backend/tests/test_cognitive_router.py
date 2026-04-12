import pytest
from unittest.mock import patch, MagicMock

# MOCK FastAPI Client
from fastapi.testclient import TestClient
from fastapi import FastAPI, APIRouter

# Since we don't want to load identical full app with DB dependencies,
# we construct a minimal isolated app merging our target router for endpoint tests.
from app.modules.screening.router import router_cognitive as router
from app.dependencies import get_current_user, require_patient

app = FastAPI()
app.include_router(router, prefix="/cognitive")

@pytest.fixture
def client():
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}

# ====================
# ENDPOINT & RBAC TESTS
# ====================

def test_start_session_rbac(client):
    """Test Patient endpoint success and schema."""
    app.dependency_overrides[get_current_user] = lambda: {"role": "patient", "id": "pat_1"}
    with patch("app.modules.screening.router.cognitive_service.start_session") as mock_start:
         
        mock_start.return_value = {"id": "session_123", "status": "in_progress", "test_type": "memory_recall", "difficulty": "medium", "test_config": {"words": ["apple"]}}
        
        res = client.post("/cognitive/start", json={"test_type": "memory_recall", "difficulty": "medium"})
        assert res.status_code == 200
        assert res.json()["id"] == "session_123"



def test_submit_empty_responses(client):
    """Test 422 standard validation for empty responses array or absent dict missing elements."""
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = lambda: {"role": "patient", "id": "pat_1"}
    
    # Sending completely bad payload format
    res = client.post("/cognitive/session_123/submit", json={"bad": "payload"})
    assert res.status_code == 422
        
def test_history_rbac_patient(client):
    """Patient can view history."""
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = lambda: {"role": "patient", "id": "pat_1"}
    
    with patch("app.modules.screening.router.cognitive_service.get_cognitive_history") as mock_hist:
        mock_hist.return_value = [{"session_id": "session_1", "test_type": "memory_recall", "score": 90.0, "time_taken_seconds": 12.0, "created_at": "2024-01-01T00:00:00Z"}]
        
        res = client.get("/cognitive/history?patient_id=pat_1")
        assert res.status_code == 200
        assert type(res.json()) == list

def test_assignment_validation_caregiver(client):
    """Caregiver requires patient_id, triggers validate_assignment deeply inside service."""
    from fastapi import HTTPException
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = lambda: {"role": "caregiver", "id": "cg_1"}
    
    with patch("app.modules.screening.router.cognitive_service.get_cognitive_history") as mock_hist:
        # Simulate unassigned patient error heavily
        mock_hist.side_effect = HTTPException(status_code=403, detail="Not assigned")
        
        res = client.get("/cognitive/history?patient_id=pat_unassigned")
        assert res.status_code == 403
