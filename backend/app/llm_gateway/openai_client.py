"""
NeuroVia OpenAI Gateway — Phase 7
Provides isolated async access to OpenAI API as a secondary/fallback provider.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None


class OpenAIClient:
    """Async Client tying specifically to OpenAI infrastructure."""

    def __init__(self, api_key: str, model: str = "gpt-4o", timeout: float = 15.0):
        # Graceful degradation if dependency missing or key bad
        if AsyncOpenAI is None or not api_key or api_key.startswith("your_"):
            self.available = False
            self.client = None
            logger.warning("[OpenAIClient] OpenAI SDK missing or API key invalid. Client disabled.")
        else:
            self.available = True
            self.client = AsyncOpenAI(api_key=api_key, timeout=timeout)
            
        self.model = model

    def check_health(self) -> bool:
        """Validates if the client is heavily configured and theoretically callable."""
        return self.available

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate raw text completion using chat format."""
        if not self.available:
             return "OpenAI Provider Disabled or Misconfigured"
             
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"[OpenAIClient] Inference failed: {e}")
            return f"OpenAI Inference Error: {str(e)}"

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Force OpenAI into precise JSON generation mode."""
        if not self.available:
             return '{"error": "OpenAI Provider Disabled"}'
             
        messages = []
        # JSON mode requires "json" to be literally stated in system prompt per API rules
        sys_str = system_prompt if system_prompt else "You are an assistant."
        messages.append({"role": "system", "content": sys_str + " IMPORTANT: Return only pure JSON object."})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=messages,
                temperature=0.1
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"[OpenAIClient] JSON Inference failed: {e}")
            return f'{{"error": "OpenAI JSON Inference Error: {str(e)}"}}'
