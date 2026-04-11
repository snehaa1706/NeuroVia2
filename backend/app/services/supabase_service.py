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
        """
        # Fetch patient profile
        patient = supabase_helpers.get_user_by_id(patient_id)
        if not patient:
            # Degraded mode fallback for ghost sessions caused by dummy backend hot reloads
            patient = {
                "id": patient_id,
                "full_name": "Unknown Patient (Ghost Session)",
                "email": "ghost@neurovia.com"
            }

        # Fetch patient's health and cognitive data
        reports = supabase_helpers.get_patient_records_for_doctor(self.user_id, patient_id, "daily_reports", limit=7)
        activities = supabase_helpers.get_patient_records_for_doctor(self.user_id, patient_id, "activity_results", limit=20)
        
        return {
            "patient": {
                "id": patient.get("id", patient_id),
                "full_name": patient.get("full_name", "Unknown Patient"),
                "email": patient.get("email", "")
            },
            "latest_report": reports[0] if reports else None,
            "history": reports,
            "activities": activities,
            "domain_scores": self.compute_domain_scores(activities)
        }

    def compute_domain_scores(self, activities: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Compute average scores across cognitive domains (Memory, Attention, etc.).
        """
        domains = ["Memory", "Attention", "Language", "Executive", "Recognition"]
        scores = {d: [] for d in domains}
        
        for act in activities:
            meta = act.get("metadata", {})
            for d in domains:
                # If activities have domain scores in their result
                if d in meta:
                    scores[d].append(float(meta[d]))
                # Fallback to simple logic based on activity type if exists
        
        # Calculate averages (default to 0.0)
        return {d: (sum(vals) / len(vals)) if vals else 0.0 for d, vals in scores.items()}
