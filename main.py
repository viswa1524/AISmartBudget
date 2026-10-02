"""
main.py
-------
PocketSmart AI - Smart Budget & Recommendation Assistant
FastAPI application entry point: routes, request handling, and the
glue between the database, templates, and the AI service.
"""

from datetime import datetime
from typing import Optional
from urllib.parse import quote

from fastapi import Depends, FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db
from services.ai_service import AIService

# Load GEMINI_API_KEY (and any other vars) from a local .env file, if present.
load_dotenv()

# Create all tables on startup if they don't already exist.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PocketSmart AI", description="Smart Budget & Recommendation Assistant")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

ai_service = AIService()

EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Education",
    "Shopping",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Other",
]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def get_current_budget(db: Session) -> models.Budget:
    """Returns the single Budget row, creating a default one (₹0) the
    first time the app is used."""
    budget = db.query(models.Budget).first()
    if not budget:
        budget = models.Budget(monthly_budget=0.0)
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget


def compute_summary(db: Session) -> dict:
    """Computes all the numbers the dashboard/budget pages need in one place."""
    total_income = db.query(func.coalesce(func.sum(models.Income.amount), 0.0)).scalar() or 0.0
    total_expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0.0)).scalar() or 0.0
    budget = get_current_budget(db)

    category_rows = (
        db.query(models.Expense.category, func.sum(models.Expense.amount))
        .group_by(models.Expense.category)
        .all()
    )
    category_summary = {cat: float(total) for cat, total in category_rows}

    total_income = float(total_income)
    total_expenses = float(total_expenses)
    budget_amount = float(budget.monthly_budget or 0.0)
    remaining_balance = total_income - total_expenses

    budget_used_pct = 0.0
    if budget_amount > 0:
        budget_used_pct = round((total_expenses / budget_amount) * 100, 1)

    warning = None
    if budget_amount > 0:
        if budget_used_pct >= 100:
            warning = "You have exceeded your monthly budget!"
        elif budget_used_pct >= 80:
            warning = "You are close to your monthly budget limit."

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "remaining_balance": remaining_balance,
        "budget": budget_amount,
        "budget_used_pct": budget_used_pct,
        "category_summary": category_summary,
        "warning": warning,
    }


def parse_amount(raw: str, field_name: str = "Amount") -> float:
    """Validates and parses a form amount string. Raises ValueError with
    a user-friendly message on anything invalid."""
    try:
        value = float(raw)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number.")
    if value <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")
    return value


def parse_date(raw: str) -> "datetime.date":
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValueError("Date must be in YYYY-MM-DD format.")


def redirect_with_error(path: str, message: str) -> RedirectResponse:
    return RedirectResponse(url=f"{path}?error={quote(message)}", status_code=303)


# ---------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    summary = compute_summary(db)
    recent_income = (
        db.query(models.Income).order_by(models.Income.date.desc(), models.Income.id.desc()).limit(5).all()
    )
    recent_expenses = (
        db.query(models.Expense).order_by(models.Expense.date.desc(), models.Expense.id.desc()).limit(5).all()
    )
    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {
            "summary": summary,
            "recent_income": recent_income,
            "recent_expenses": recent_expenses,
        },
    )


# ---------------------------------------------------------------------
# Income
# ---------------------------------------------------------------------

@app.get("/income", response_class=HTMLResponse)
async def income_page(request: Request, error: Optional[str] = None, db: Session = Depends(get_db)):
    income_list = db.query(models.Income).order_by(models.Income.date.desc(), models.Income.id.desc()).all()
    total_income = sum(i.amount for i in income_list)
    return templates.TemplateResponse(
        request,
        "income.html",
        {
            "income_list": income_list,
            "total_income": total_income,
            "error": error,
        },
    )


@app.post("/income/add")
async def add_income(
    source: str = Form(...),
    amount: str = Form(...),
    date: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
):
    if not source.strip():
        return redirect_with_error("/income", "Source is required.")

    try:
        amount_val = parse_amount(amount, "Income amount")
        date_val = parse_date(date)
    except ValueError as exc:
        return redirect_with_error("/income", str(exc))

    try:
        new_income = models.Income(
            source=source.strip(),
            amount=amount_val,
            date=date_val,
            description=description.strip() or None,
        )
        db.add(new_income)
        db.commit()
    except Exception:
        db.rollback()
        return redirect_with_error("/income", "Database error while saving income.")

    return RedirectResponse(url="/income", status_code=303)


@app.post("/income/delete/{income_id}")
async def delete_income(income_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Income).filter(models.Income.id == income_id).first()
    if item:
        try:
            db.delete(item)
            db.commit()
        except Exception:
            db.rollback()
            return redirect_with_error("/income", "Database error while deleting income.")
    return RedirectResponse(url="/income", status_code=303)


# ---------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------

@app.get("/expenses", response_class=HTMLResponse)
async def expenses_page(request: Request, error: Optional[str] = None, db: Session = Depends(get_db)):
    expense_list = db.query(models.Expense).order_by(models.Expense.date.desc(), models.Expense.id.desc()).all()
    total_expenses = sum(e.amount for e in expense_list)
    return templates.TemplateResponse(
        request,
        "expenses.html",
        {
            "expense_list": expense_list,
            "total_expenses": total_expenses,
            "categories": EXPENSE_CATEGORIES,
            "error": error,
        },
    )


@app.post("/expenses/add")
async def add_expense(
    category: str = Form(...),
    amount: str = Form(...),
    date: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
):
    if category not in EXPENSE_CATEGORIES:
        return redirect_with_error("/expenses", "Invalid category selected.")

    try:
        amount_val = parse_amount(amount, "Expense amount")
        date_val = parse_date(date)
    except ValueError as exc:
        return redirect_with_error("/expenses", str(exc))

    try:
        new_expense = models.Expense(
            category=category,
            amount=amount_val,
            date=date_val,
            description=description.strip() or None,
        )
        db.add(new_expense)
        db.commit()
    except Exception:
        db.rollback()
        return redirect_with_error("/expenses", "Database error while saving expense.")

    return RedirectResponse(url="/expenses", status_code=303)


@app.post("/expenses/delete/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if item:
        try:
            db.delete(item)
            db.commit()
        except Exception:
            db.rollback()
            return redirect_with_error("/expenses", "Database error while deleting expense.")
    return RedirectResponse(url="/expenses", status_code=303)


# ---------------------------------------------------------------------
# Budget
# ---------------------------------------------------------------------

@app.get("/budget", response_class=HTMLResponse)
async def budget_page(request: Request, error: Optional[str] = None, db: Session = Depends(get_db)):
    summary = compute_summary(db)
    return templates.TemplateResponse(
        request, "budget.html", {"summary": summary, "error": error}
    )


@app.post("/budget/update")
async def update_budget(monthly_budget: str = Form(...), db: Session = Depends(get_db)):
    try:
        amount_val = float(monthly_budget)
        if amount_val < 0:
            raise ValueError("Budget cannot be negative.")
    except (TypeError, ValueError):
        return redirect_with_error("/budget", "Budget must be a valid, non-negative number.")

    try:
        budget = get_current_budget(db)
        budget.monthly_budget = amount_val
        db.commit()
    except Exception:
        db.rollback()
        return redirect_with_error("/budget", "Database error while saving budget.")

    return RedirectResponse(url="/budget", status_code=303)


# ---------------------------------------------------------------------
# AI Recommendations
# ---------------------------------------------------------------------

@app.get("/recommendations", response_class=HTMLResponse)
async def recommendations_page(request: Request):
    return templates.TemplateResponse(request, "recommendations.html")


@app.post("/api/recommendations")
async def api_recommendations(db: Session = Depends(get_db)):
    summary = compute_summary(db)
    context = {
        "total_income": summary["total_income"],
        "total_expenses": summary["total_expenses"],
        "monthly_budget": summary["budget"],
        "remaining_balance": summary["remaining_balance"],
        "category_summary": summary["category_summary"],
    }
    result = await ai_service.get_budget_recommendation(context)
    return JSONResponse(content=result)


# ---------------------------------------------------------------------
# Fallback error handling: keep the rest of the app usable even if
# something unexpected throws (e.g. a corrupted DB row).
# ---------------------------------------------------------------------

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return HTMLResponse(
        content=(
            "<h1>Something went wrong</h1>"
            f"<p>{type(exc).__name__}: {exc}</p>"
            "<p><a href='/dashboard'>Back to Dashboard</a></p>"
        ),
        status_code=500,
    )


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
