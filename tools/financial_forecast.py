#!/usr/bin/env python3
"""
Python Financial Forecast & Compound Growth Tool
Simulates compound interest, monthly savings runway, and milestone target dates.
"""
import sys
import json
import argparse

def simulate_growth(starting_balance: float, monthly_contribution: float, annual_return_pct: float, years: int):
    monthly_rate = (annual_return_pct / 100.0) / 12.0
    total_months = years * 12
    
    balance = starting_balance
    total_contributed = starting_balance
    milestones = []
    
    for month in range(1, total_months + 1):
        interest_earned = balance * monthly_rate
        balance += interest_earned + monthly_contribution
        total_contributed += monthly_contribution
        
        if month % 12 == 0:
            year_num = month // 12
            milestones.append({
                "year": year_num,
                "total_balance": round(balance, 2),
                "total_contributed": round(total_contributed, 2),
                "total_interest": round(balance - total_contributed, 2)
            })
            
    return {
        "status": "success",
        "starting_balance": starting_balance,
        "monthly_contribution": monthly_contribution,
        "annual_return_pct": annual_return_pct,
        "years": years,
        "final_balance": round(balance, 2),
        "total_contributed": round(total_contributed, 2),
        "total_interest_earned": round(balance - total_contributed, 2),
        "yearly_milestones": milestones
    }

def print_forecast(data):
    print("=" * 64)
    print(" PYTHON FINANCIAL FORECAST & COMPOUND GROWTH SIMULATOR")
    print(f" Starting: ${data['starting_balance']:,.2f} | Monthly: ${data['monthly_contribution']:,.2f} | APR: {data['annual_return_pct']}%")
    print("=" * 64)
    print(f"{'Year':<6} | {'Contributed ($)':<16} | {'Interest ($)':<16} | {'Balance ($)':<16}")
    print("-" * 64)
    for m in data["yearly_milestones"]:
        print(f"Year {m['year']:<2} | ${m['total_contributed']:>14,.2f} | ${m['total_interest']:>14,.2f} | ${m['total_balance']:>14,.2f}")
    print("-" * 64)
    print(f"FINAL PROJECTED WEALTH: ${data['final_balance']:,.2f}")
    print(f"TOTAL FREE INTEREST EARNED: ${data['total_interest_earned']:,.2f}")
    print("=" * 64)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compound Growth & Savings Forecast in Python")
    parser.add_argument("--start", type=float, default=5000.0, help="Initial savings balance")
    parser.add_argument("--monthly", type=float, default=500.0, help="Monthly recurring contribution")
    parser.add_argument("--rate", type=float, default=7.5, help="Estimated annual return percent (e.g. 7.5)")
    parser.add_argument("--years", type=int, default=5, help="Number of projection years")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()
    res = simulate_growth(args.start, args.monthly, args.rate, args.years)
    
    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print_forecast(res)
