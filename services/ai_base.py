"""
services/ai_base.py
--------------------
Abstract interface every AI provider must implement. This is the piece
that makes the "multi-AI architecture" possible: the rest of the app
(ai_service.py) only ever talks to this interface, never to a specific
provider's API directly. To add a second provider later (e.g. OpenAI),
you just write a new class that implements generate_recommendation()
and pass it into AIService — nothing else in the app has to change.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class AIProvider(ABC):
    @abstractmethod
    async def generate_recommendation(self, context: Dict[str, Any]) -> str:
        """
        Given a context dict describing the user's finances
        (income, expenses, budget, category breakdown, etc.),
        return a plain-text recommendation string.

        Implementations should raise an exception (ideally a subclass
        of Exception specific to that provider) on failure, rather than
        returning an empty or fake response.
        """
        raise NotImplementedError
