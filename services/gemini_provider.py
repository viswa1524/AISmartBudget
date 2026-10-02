"""
services/gemini_provider.py
----------------------------
Concrete AIProvider implementation that talks to Google's Gemini API
using an async HTTPX client. The API key is read from the
GEMINI_API_KEY environment variable — never hard-coded.
"""

import os
from typing import Any, Dict, Optional

import httpx

from .ai_base import AIProvider

GEMINI_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-1.5-flash"
]


class GeminiProviderError(Exception):
    """Raised whenever the Gemini API call fails for any reason
    (missing key, network error, bad response, unexpected format)."""


class GeminiProvider(AIProvider):
    def __init__(self, api_key: Optional[str] = None):
        # Read API key strictly from passed argument or environment variable
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    def _build_prompt(self, context: Dict[str, Any]) -> str:
        category_lines = "\n".join(
            f"  - {cat}: {amt:.2f}"
            for cat, amt in (context.get("category_summary") or {}).items()
        ) or "  - No expenses recorded yet."

        return (
            "You are a friendly, practical personal finance assistant. "
            "Based on the financial snapshot below, give the user "
            "3 to 5 short, numbered, specific budgeting tips. "
            "Reference the actual numbers where it helps. "
            "Keep the entire answer under 200 words and avoid generic "
            "filler advice.\n\n"
            f"Monthly income: {context.get('total_income', 0):.2f}\n"
            f"Monthly expenses: {context.get('total_expenses', 0):.2f}\n"
            f"Monthly budget: {context.get('monthly_budget', 0):.2f}\n"
            f"Remaining balance: {context.get('remaining_balance', 0):.2f}\n"
            f"Spending by category:\n{category_lines}\n"
        )

    async def generate_recommendation(self, context: Dict[str, Any]) -> str:
        if not self.api_key:
            raise GeminiProviderError(
                "GEMINI_API_KEY is not set. Add it to your .env file "
                "to enable AI recommendations."
            )

        prompt = self._build_prompt(context)
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        params = {"key": self.api_key}

        last_error = None
        for model in GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    response = await client.post(url, params=params, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return text.strip()
                    else:
                        last_error = f"Gemini API returned status {response.status_code}: {response.text[:200]}"
            except httpx.RequestError as exc:
                last_error = f"Could not reach the Gemini API: {exc}"
            except (KeyError, IndexError, ValueError) as exc:
                last_error = f"Unexpected response format from the Gemini API: {exc}"

        raise GeminiProviderError(last_error or "Unable to retrieve recommendations from Gemini.")
