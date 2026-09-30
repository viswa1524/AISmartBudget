import json
import os
import re
from datetime import date, datetime
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).parent
DB_FILE = ROOT / "db.json"
app = FastAPI(title="AISmartBudget", description="A simple AI-powered budget manager")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


def default_db():
    return {"transactions": [], "categories": [], "goals": [], "bills": [], "currency": "USD", "updatedAt": datetime.utcnow().isoformat()}


def read_db():
    try:
        return json.loads(DB_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return default_db()


def write_db(data):
    data["updatedAt"] = datetime.utcnow().isoformat()
    DB_FILE.write_text(json.dumps(data, indent=2))


class TransactionRequest(BaseModel):
    transaction: dict


class PlanRequest(BaseModel):
    budget: float
    goal: str = "your goal"


class AssistantRequest(BaseModel):
    message: str
    summary: dict = {}


@app.get("/")
def home():
    return FileResponse(ROOT / "index.html")


@app.get("/api/data")
def get_data():
    return {"success": True, "data": read_db()}


@app.post("/api/transactions")
def add_transaction(payload: TransactionRequest):
    tx = dict(payload.transaction)
    if not tx.get("amount") or float(tx["amount"]) <= 0:
        return {"success": False, "error": "A positive amount is required"}
    tx.setdefault("id", f"tx_{datetime.utcnow().timestamp()}")
    tx.setdefault("date", str(date.today()))
    data = read_db()
    data["transactions"].insert(0, tx)
    write_db(data)
    return {"success": True, "transaction": tx}


@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: str):
    data = read_db()
    data["transactions"] = [t for t in data["transactions"] if t.get("id") != transaction_id]
    write_db(data)
    return {"success": True}


@app.post("/api/reset-data")
def reset_data():
    write_db(default_db())
    return {"success": True}


@app.post("/api/plan")
def create_plan(payload: PlanRequest):
    budget = max(0, float(payload.budget))
    return {"success": True, "plan": {"needs": round(budget * .5, 2), "wants": round(budget * .3, 2), "savings": round(budget * .2, 2)}}


@app.post("/api/assistant")
def assistant(payload: AssistantRequest):
    message = payload.message.lower()
    income = float(payload.summary.get("income", 0) or 0)
    expense = float(payload.summary.get("expense", 0) or 0)
    balance = income - expense
    if any(word in message for word in ("save", "saving", "goal")):
        reply = "Start with a small automatic transfer on payday. Aim for 20% of income if you can; even 5% is a strong start."
    elif any(word in message for word in ("spend", "expense", "cost", "balance")):
        reply = f"You have spent ${expense:,.2f} so far and have ${balance:,.2f} left from recorded income. Review your biggest category before making the next purchase."
    elif any(word in message for word in ("budget", "plan")):
        reply = "Try the 50/30/20 plan: 50% for needs, 30% for wants, and 20% for savings. Adjust the split to match your real life."
    else:
        reply = "A good next step is to record every purchase for one week. Once your spending is visible, choose one category to trim gently."
    return {"success": True, "reply": reply}


@app.get("/api/health")
def health():
    data = read_db()
    return {"status": "ok", "transactions": len(data["transactions"]), "python": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
