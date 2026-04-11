"""
NeuroVia Doctor Insights — Phase 6
Generates clinical narratives from AI Gateway inputs.
"""

import json
import logging
from typing import Dict, Any

from app.llm_gateway.ollama_client import OllamaClient
from app.llm_gateway.openai_client import OpenAIClient
from app.ai_config import ai_config

logger = logging.getLogger(__name__)


class DoctorInsightsGenerator:
    """Manages the generation of clinical narratives and insight summaries via LLMs."""

    def __init__(self):
        self.ollama_client = OllamaClient(
            host=ai_config.OLLAMA_HOST,
            model=ai_config.OLLAMA_MODEL,
            timeout=ai_config.OLLAMA_TIMEOUT
        )
        # Assuming OPENAI_API_KEY is handled via config or elsewhere if used.
        # Fallback uses mock API key instantiation to rely on environment
        import os
        self.openai_client = OpenAIClient(api_key=os.getenv("OPENAI_API_KEY", ""))

    async def generate_doctor_insight(self, patient_summary: Dict[str, Any]) -> str:
        """Generates a structured clinical insight narrative."""
        if not ai_config.ENABLE_LLM_INSIGHTS:
            return "Advanced clinical narrative generation is disabled."
            
        system_prompt = (
            "You are a Neurologist analyzing a composite patient cognitive profile. "
            "Respond ONLY with a clear, professional medical summary suitable for "
            "another clinician. Be brief (2-3 sentences max). Focus on highlighted risks."
        )
        
        prompt_data = json.dumps(patient_summary, indent=2)
        prompt = f"Please evaluate the following clinical assessment dimensions:\n{prompt_data}"

        # 1. Primary configured provider
        if ai_config.LLM_PRIMARY == "openai" and self.openai_client.check_health():
             insight = await self.openai_client.generate(prompt, system_prompt)
             if "OpenAI Inference Error" not in insight:
                  return insight
                  
        # 2. Ollama Secondary/Fallback Flow (Often the primary local)
        try:
             # Very fast ping to see if local container is running
             if await self.ollama_client.check_health():
                 logger.info("Executing Ollama Insight inference...")
                 insight = await self.ollama_client.generate(prompt, system_prompt)
                 return insight
        except Exception as e:
             logger.warning(f"Ollama generation failed: {e}")

        # 3. Emergency Hard Fallback
        logger.warning("All LLM providers failed. Executing heuristic insight fallback.")
        return self._generate_heuristic_insight(patient_summary)

    def _generate_heuristic_insight(self, patient_summary: Dict[str, Any]) -> str:
        """Rules-based text generation if all LLMs are down."""
        risk_data = patient_summary.get("risk", {})
        risk_level = risk_data.get("risk_level", "Unknown")
        
        trend_data = patient_summary.get("trend", {})
        trend = trend_data.get("trend", "Unknown")
        
        pieces = []
        if risk_level == "High":
             pieces.append("Patient exhibits significant multi-domain cognitive friction indicating potential pathology.")
        elif risk_level == "Moderate":
             pieces.append("Patient demonstrates mild cognitive impairment with borderline scoring metrics.")
        else:
             pieces.append("Patient cognitive domains appear intact and perform within expected neurotypical parameters.")
             
        if trend == "Declining":
             pieces.append("Longitudinal tracking reveals a compounding decline across recent assessments.")
        elif trend == "Fluctuating":
             pieces.append("Performance stability is erratic but lacks a distinct downward negative trajectory.")
             
        pieces.append("A formal scheduled clinical follow-up is recommended to establish baseline diagnostics.")
        
        return " ".join(pieces)
