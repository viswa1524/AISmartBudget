#!/usr/bin/env python3
"""
Python Expense & Transaction Diagnostics Tool
Reads database JSON, calculates category shares, cash burn rates, and health grades.
"""
import sys
import json
import os

def analyze_expenses(db_path: str = "db.json"):
    if not os.path.exists(db_path):
        return {"status": "error", "message": f"Database file '{db_path}' not found"}

    try:
        with open(db_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    transactions = data.get("transactions", [])
    total_income = sum(t["amount"] for t in transactions if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in transactions if t.get("type") == "expense")
    net_savings = total_income - total_expense
    savings_rate = round((net_savings / total_income * 100), 1) if total_income > 0 else 0

    # Categorize expenses
    cat_totals = {}
    for t in transactions:
        if t.get("type") == "expense":
            cat = t.get("category", "General")
            cat_totals[cat] = cat_totals.get(cat, 0) + float(t.get("amount", 0))

    cat_breakdown = [
        {
            "category": cat,
            "amount": round(amt, 2),
            "percentage": round(amt / total_expense * 100, 1) if total_expense > 0 else 0
        }
        for cat, amt in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    grade = "A+" if savings_rate >= 25 else "A" if savings_rate >= 20 else "B" if savings_rate >= 10 else "C" if savings_rate >= 0 else "D (Deficit)"

    return {
        "status": "success",
        "total_transactions": len(transactions),
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate_pct": savings_rate,
        "financial_health_grade": grade,
        "categories": cat_breakdown
    }

if __name__ == "__main__":
    db_file = sys.argv[1] if len(sys.argv) > 1 else "db.json"
    analysis = analyze_expenses(db_file)
    print(json.dumps(analysis, indent=2))
