"""
NeuroVia AI Orchestrator — Phase 9
The Central Pipeline Controller.
Executes AI components in parallel where safe, manages hashing caches, and returns standardized output.
DO NOT CALL internal AI services or ML classes from routes directly. Call them via this class.
"""

import json
import logging
import asyncio
from typing import Dict, Any

from app.ai_config import ai_config
from app.ai_services.ai_cache import ai_cache

# Import underlying engines
from app.ai_models.risk_prediction import RiskPredictor
from app.ai_models.trend_analysis import TrendAnalyzer
from app.ai_models.clock_analysis import ClockAnalyzer
from app.ai_services.semantic_validation import SemanticValidator
from app.ai_services.doctor_insights import DoctorInsightsGenerator
from app.ai_services.report_generator import generate_cognitive_report

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """Manages the complete lifecycle and control flow of AI execution."""

    def __init__(self):
        # Heavy class initialization happens once when the orchestrator singleton is booted
        if ai_config.ENABLE_RISK_PREDICTION:
            try:
                self.risk_model = RiskPredictor()
            except Exception as e:
                logger.error(f"[Orchestrator] failed to spin up Risk Predictor: {e}")
                self.risk_model = None
        else:
            self.risk_model = None
            
        self.trend_model = TrendAnalyzer()
        
        if ai_config.ENABLE_LLM_INSIGHTS:
             self.doctor_model = DoctorInsightsGenerator()
        else:
             self.doctor_model = None

    def _get_cache_hash(self, prefix: str, data: Any) -> str:
         # Wrap the data in a dictionary with the prefix to ensure unique hashes per operation
         hashed_struct = {"_op": prefix, "data": data}
         return json.dumps(hashed_struct, sort_keys=True, default=str)

    # ---------------------------------------------
    # Individual Component Executor Wrappers
    # (CPU-bound — designed to run via asyncio.to_thread)
    # ---------------------------------------------

    def run_risk_prediction(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates risk using XGBoost, leveraging cache."""
        if not ai_config.ENABLE_RISK_PREDICTION or self.risk_model is None:
             return {"risk_score": 0.0, "risk_level": "Off", "description": "Disabled"}
             
        c_key = self._get_cache_hash("risk", patient_data)
        cached = ai_cache.get(c_key)
        if cached:
             return cached
             
        res = self.risk_model.predict_risk(patient_data)
        ai_cache.set(c_key, res)
        return res

    def run_trend_analysis(self, wellness_history: list) -> Dict[str, Any]:
        """Calculates time-series risk vectors, leveraging cache."""
        if not ai_config.ENABLE_TREND_ANALYSIS:
            return {"trend": "Off", "slope_vector": 0.0, "patterns": [], "recommendation": "Disabled"}
            
        c_key = self._get_cache_hash("trend", wellness_history)
        cached = ai_cache.get(c_key)
        if cached:
             return cached
             
        res = self.trend_model.analyze_cognitive_trend(wellness_history)
        ai_cache.set(c_key, res)
        return res

    def run_semantic_validation(self, words: list, category: str = "animals") -> Dict[str, Any]:
        """Process words through NLP validation dictionaries."""
        if not ai_config.ENABLE_SEMANTIC_VALIDATION:
             return {"valid_words": words, "invalid_words": [], "score": len(words)}
             
        c_key = self._get_cache_hash("semantic", {"w": words, "c": category})
        cached = ai_cache.get(c_key)
        if cached:
             return cached
             
        res = SemanticValidator.validate_semantic_answers(words, category)
        ai_cache.set(c_key, res)
        return res

    def run_clock_analysis(self, image_b64: str) -> Dict[str, Any]:
        """Route clock images to OpenCV processor."""
        if not ai_config.ENABLE_CLOCK_ANALYSIS:
             return {"score": 0, "assessment": "Disabled"}
             
        c_key = self._get_cache_hash("clock", image_b64[:100]) # only hash first 100 char to save CPU mapping
        cached = ai_cache.get(c_key)
        if cached:
             return cached
             
        res = ClockAnalyzer.analyze_clock_image(image_b64)
        ai_cache.set(c_key, res)
        return res

    async def run_doctor_insights(self, pipeline_data: Dict[str, Any]) -> str:
        """Route internal json payload to LLM generators."""
        if not ai_config.ENABLE_LLM_INSIGHTS or self.doctor_model is None:
             return "LLM integration disabled in configuration."
             
        c_key = self._get_cache_hash("insight", pipeline_data)
        cached = ai_cache.get(c_key)
        if cached:
             return cached
             
        res = await self.doctor_model.generate_doctor_insight(pipeline_data)
        ai_cache.set(c_key, res)
        return res

    # ---------------------------------------------
    # Full Integrated Pipeline (Parallelized)
    # ---------------------------------------------

    async def run_full_analysis(self, req_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the entire end-to-end AI cascade.
        Parallelizes deterministic models via asyncio.gather + to_thread.
        Clock analysis runs separately. LLM runs last (depends on prior results).
        """
        # 1. Gather all inputs
        p_data = req_data.get("patient_metrics", {})
        w_hist = req_data.get("wellness_history", [])
        s_words = req_data.get("semantic_words", [])
        s_cat = req_data.get("semantic_category", "animals")
        c_img = req_data.get("clock_image_b64", "")

        state = {}

        # 2. Execute deterministic models IN PARALLEL via thread pool
        # These are CPU-bound and safe to parallelize
        try:
            risk_result, trend_result, semantic_result = await asyncio.gather(
                asyncio.to_thread(self.run_risk_prediction, p_data),
                asyncio.to_thread(self.run_trend_analysis, w_hist),
                asyncio.to_thread(self.run_semantic_validation, s_words, s_cat),
            )
            state["risk"] = risk_result
            state["trend"] = trend_result
            state["semantic"] = semantic_result
        except Exception as e:
            logger.error(f"[Orchestrator] Parallel execution failed, falling back to sequential: {e}")
            # Safe fallback: run sequentially if gather fails
            state["risk"] = self.run_risk_prediction(p_data)
            state["trend"] = self.run_trend_analysis(w_hist)
            state["semantic"] = self.run_semantic_validation(s_words, s_cat)

        # 3. Clock analysis runs separately (image-dependent, heavier)
        if c_img:
            try:
                state["clock"] = await asyncio.to_thread(self.run_clock_analysis, c_img)
            except Exception as e:
                logger.error(f"[Orchestrator] Clock analysis thread failed: {e}")
                state["clock"] = self.run_clock_analysis(c_img)
        else:
            state["clock"] = {"score": 0, "assessment": "No image provided"}

        # 4. Execute Neural Engine (IO-bound HTTP LLM — always async)
        # We pass the previously calculated state right into it
        state["doctor_summary"] = await self.run_doctor_insights({
            "risk": state["risk"],
            "trend": state["trend"],
            "semantic": state["semantic"],
            "clock": state["clock"]
        })

        # 5. Synthesize everything into the Final Report layout
        final_payload = generate_cognitive_report(state)

        return final_payload

# Global Singleton
orchestrator = AIOrchestrator()
