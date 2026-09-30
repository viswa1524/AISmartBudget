export interface Budget503020Result {
  totalIncome: number;
  mode: string;
  needs: { percentage: number; amount: number; categories: string[] };
  wants: { percentage: number; amount: number; categories: string[] };
  savings: { percentage: number; amount: number; categories: string[] };
}

export declare class BudgetEngine {
  static calculate503020(monthlyIncome: number, mode?: string): Budget503020Result;
  static simulateCompoundGrowth(initialPrincipal: number, monthlyAddition: number, annualRatePct: number, years: number): any;
  static calculateEmergencyRunway(currentSavings: number, monthlyEssentialExpenses: number): any;
  static evaluateFinancialHealth(data: { income?: number; expenses?: number; savings?: number; debtPayments?: number }): any;
}
