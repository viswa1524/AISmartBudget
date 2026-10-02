"""
schemas.py
----------
Pydantic models used for API request/response validation, separate
from the SQLAlchemy database models in models.py.
"""

from datetime import date as date_type
from typing import Optional, Dict

from pydantic import BaseModel, ConfigDict


class IncomeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    amount: float
    date: date_type
    description: Optional[str] = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    amount: float
    date: date_type
    description: Optional[str] = None


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    monthly_budget: float


class RecommendationResponse(BaseModel):
    success: bool
    recommendation: Optional[str] = None
    error: Optional[str] = None


class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    remaining_balance: float
    budget: float
    budget_used_pct: float
    category_summary: Dict[str, float]
    warning: Optional[str] = None
