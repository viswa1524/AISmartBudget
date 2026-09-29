#!/usr/bin/env python3
"""
Python Budget Splitter Tool
Calculates optimized budget allocations across categories and project milestones.
Compatible with standard Python 3.10+ without external pip dependencies.
"""
import sys
import json
import argparse

def calculate_budget_split(total_budget: float, goal: str, rule: str = "project"):
    total = float(total_budget)
    allocations = []
    
    if rule == "50-30-20":
        allocations = [
            {"category": "Needs & Core Essentials", "percentage": 50, "amount": round(total * 0.50, 2)},
            {"category": "Wants & Lifestyle Enhancements", "percentage": 30, "amount": round(total * 0.30, 2)},
            {"category": "Savings & Debt Reduction", "percentage": 20, "amount": round(total * 0.20, 2)},
        ]
    elif rule == "emergency-fund":
        allocations = [
            {"category": "High-Yield Liquid Cash Reserve", "percentage": 70, "amount": round(total * 0.70, 2)},
            {"category": "Short-Term Treasury Bills / MMF", "percentage": 20, "amount": round(total * 0.20, 2)},
            {"category": "Immediate Cash Buffer", "percentage": 10, "amount": round(total * 0.10, 2)},
        ]
    else:
        allocations = [
            {"category": "Core Scope & Primary Execution", "percentage": 45, "amount": round(total * 0.45, 2)},
            {"category": "Professional Labor & Services", "percentage": 30, "amount": round(total * 0.30, 2)},
            {"category": "Logistics, Tools & Equipment", "percentage": 10, "amount": round(total * 0.10, 2)},
            {"category": "Contingency & Emergency Margin", "percentage": 15, "amount": round(total * 0.15, 2)},
        ]
        
    return {
        "status": "success",
        "total_budget": total,
        "goal": goal,
        "rule_applied": rule,
        "allocations": allocations,
        "summary": f"Allocated ${total:,.2f} for '{goal}' into {len(allocations)} targeted funds."
    }

def print_table(result):
    print("=" * 64)
    print(f" PYTHON BUDGET ALLOCATION TOOL: {result['goal'].upper()}")
    print(f" Total Budget: ${result['total_budget']:,.2f}  |  Rule: {result['rule_applied']}")
    print("=" * 64)
    print(f"{'Category':<36} | {'%':<5} | {'Amount ($)':<14}")
    print("-" * 64)
    for item in result["allocations"]:
        print(f"{item['category']:<36} | {item['percentage']:>3}% | ${item['amount']:>12,.2f}")
    print("-" * 64)
    print(f"SUMMARY: {result['summary']}")
    print("=" * 64)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split and plan project budgets in Python")
    parser.add_argument("--budget", type=float, default=1500.0, help="Total budget amount")
    parser.add_argument("--goal", type=str, default="Home Workspace Setup", help="Goal or project description")
    parser.add_argument("--rule", type=str, default="project", choices=["project", "50-30-20", "emergency-fund"], help="Allocation strategy")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()
    result = calculate_budget_split(args.budget, args.goal, args.rule)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_table(result)
