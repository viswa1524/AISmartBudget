"""
services/ai_service.py
------------------------
The single entry point the rest of the app uses for AI recommendations.
It holds a reference to whichever AIProvider is configured (Gemini by
default) and turns provider errors into a clean success/error dict, so
main.py never has to know or care which provider is behind it, and the
budget/income/expense features keep working even if the AI call fails.
"""

from typing import Any, Dict, Optional

from .ai_base import AIProvider
from .gemini_provider import GeminiProvider, GeminiProviderError


class AIService:
    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or GeminiProvider()

    async def get_budget_recommendation(self, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            text = await self.provider.generate_recommendation(context)
            return {"success": True, "recommendation": text, "error": None}
        except GeminiProviderError as exc:
            return {"success": False, "recommendation": None, "error": str(exc)}
        except Exception as exc:  # unexpected provider-level failure
            return {
                "success": False,
                "recommendation": None,
                "error": f"Unexpected AI error: {exc}",
            }
