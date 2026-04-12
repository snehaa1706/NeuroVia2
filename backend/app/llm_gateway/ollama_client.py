"""
NeuroVia Ollama Gateway — Phase 6
Provides isolated async access to local Ollama inference.
"""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class OllamaClient:
    """Async Client tying specifically to local Ollama installations."""

    def __init__(self, host: str = "http://localhost:11434", model: str = "llama3", timeout: float = 30.0):
        self.host = host if host else "http://localhost:11434"
        self.model = model if model else "llama3"
        self.timeout = timeout

    async def _request(self, payload: dict) -> httpx.Response:
        """Core async request wrapper with configured timeout."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(f"{self.host}/api/generate", json=payload)
                response.raise_for_status()
                return response
            except Exception as e:
                logger.error(f"[OllamaClient] Request failed: {e}")
                raise

    async def check_health(self) -> bool:
        """Check if Ollama server is reachable."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.host}/")
                return res.status_code == 200
        except Exception:
            return False

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate raw streaming text completion."""
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False
        }
        
        try:
            response = await self._request(payload)
            return response.json().get("response", "")
        except Exception as e:
            return f"Ollama Inference Error: {str(e)}"

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Force Ollama into precise JSON generation mode."""
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "format": "json" # Ollama's native strict JSON parameter
        }
        
        try:
            response = await self._request(payload)
            return response.json().get("response", "{}")
        except Exception as e:
             return f'{{"error": "Ollama JSON Inference Error: {str(e)}"}}'
