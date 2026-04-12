from typing import Dict, Any, List, Optional
from app.db import supabase_helpers
from app.db import supabase_storage

class SupabaseIntegrationService:
    """
    A service class designated exclusively to act as a secure boundary and access layer
    for Supabase interactions. It forces row-level security through the application
    layer since the underlying service client bypasses native RLS.
    
    Contains NO business logic.
    """

    def __init__(self, user: Dict[str, Any]):
        """
        Initializes the service bounded to a specific user context extracted
        from the verified JWT via FastAPI dependencies.
        """
        if "id" not in user:
            raise ValueError("Invalid user payload: Missing user_id")
        self.user_id: str = user["id"]

    # Database wrappers
    def get_records(self, table: str, limit: int = 100, custom_filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return supabase_helpers.get_records(self.user_id, table, limit, custom_filters)

    def insert_record(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return supabase_helpers.insert_record(self.user_id, table, data)

    def update_record(self, table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return supabase_helpers.update_record_safely(self.user_id, table, record_id, data)

    def delete_record(self, table: str, record_id: str) -> bool:
        return supabase_helpers.delete_record_safely(self.user_id, table, record_id)

    # Storage wrappers
    def upload_drawing(self, file_bytes: bytes, filename: str, content_type: str = "image/png") -> Optional[str]:
        return supabase_storage.upload_clock_drawing(self.user_id, file_bytes, filename, content_type)

    def download_drawing(self, filename: str) -> Optional[bytes]:
        return supabase_storage.download_clock_drawing(self.user_id, filename)

    def get_drawing_url(self, filename: str, expires_in_seconds: int = 3600) -> Optional[str]:
        return supabase_storage.create_signed_url(self.user_id, filename, expires_in_seconds)

    # Doctor Portal Support
    def get_patient_dashboard(self, patient_id: str) -> Dict[str, Any]:
        """
        Comprehensive data fetch for a specific patient (for doctor use).
        Uses actual database tables: health_logs, assessments, consultations.
        """
        from app.database import get_supabase
        sb = get_supabase()

        # Fetch patient profile
        patient = supabase_helpers.get_user_by_id(patient_id)
        if not patient:
            patient = {
                "id": patient_id,
                "full_name": "Unknown Patient (Ghost Session)",
                "email": "ghost@neurovia.com"
            }

        # Fetch health logs (replaces non-existent daily_reports)
        reports = []
        try:
            result = sb.table("health_logs").select("*").eq("user_id", patient_id).order("created_at", desc=True).limit(7).execute()
            reports = result.data or []
        except Exception:
            pass

        # Fetch assessment/screening data
        assessments = []
        try:
            result = sb.table("assessments").select("*").eq("user_id", patient_id).order("started_at", desc=True).limit(10).execute()
            assessments = result.data or []
        except Exception:
            pass

        # Fetch assessment results for each assessment
        assessment_details = []
        for a in assessments:
            try:
                result = sb.table("assessment_results").select("*").eq("assessment_id", a["id"]).execute()
                assessment_details.append({
                    **a,
                    "results": result.data or []
                })
            except Exception:
                assessment_details.append(a)

        # Fetch AI analyses for the latest assessment
        ai_analysis = None
        if assessments:
            try:
                result = sb.table("ai_analyses").select("*").eq("assessment_id", assessments[0]["id"]).execute()
                if result.data:
                    ai_analysis = result.data[0]
            except Exception:
                pass

        # Fetch consultations between this doctor and patient
        consultations = []
        try:
            result = sb.table("consultations").select("*").eq("patient_id", patient_id).order("created_at", desc=True).limit(20).execute()
            consultations = result.data or []
        except Exception:
            pass

        return {
            "patient": {
                "id": patient.get("id", patient_id),
                "full_name": patient.get("full_name", "Unknown Patient"),
                "email": patient.get("email", ""),
                "phone": patient.get("phone", ""),
                "date_of_birth": patient.get("date_of_birth"),
                "created_at": patient.get("created_at"),
            },
            "latest_report": reports[0] if reports else None,
            "history": reports,
            "assessments": assessment_details,
            "ai_analysis": ai_analysis,
            "consultations": consultations,
            "activities": [],
            "domain_scores": self._compute_domain_scores_from_assessments(assessment_details)
        }

    def _compute_domain_scores_from_assessments(self, assessments: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Compute cognitive domain scores from assessment results.
        """
        domains = ["Memory", "Attention", "Language", "Executive", "Recognition"]
        scores = {d: 0.0 for d in domains}

        if not assessments:
            return scores

        # Map test types to cognitive domains
        test_domain_map = {
            "verbal_fluency": "Language",
            "orientation": "Memory",
            "trail_making": "Executive",
            "clock_drawing": "Executive",
            "ad8": "Memory",
            "moca": "Attention",
        }

        for assessment in assessments:
            for result in assessment.get("results", []):
                test_type = result.get("test_type", "")
                domain = test_domain_map.get(test_type)
                if domain and result.get("max_score", 0) > 0:
                    scores[domain] = max(scores[domain], result["score"] / result["max_score"])

        return scores
