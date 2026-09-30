/**
 * AISmartBudget - Pure JavaScript Financial Calculation Engine
 * Language: JavaScript (ES6+)
 * 
 * Provides algorithmic financial models:
 * 1. 50/30/20 Budget Allocator
 * 2. Compound Interest & Wealth Trajectory Forecaster
 * 3. Emergency Fund Runway Calculator
 * 4. Debt Avalanche & Snowball Payoff Modeler
 * 5. Dynamic Expense Health Scorer
 */

export class BudgetEngine {
  /**
   * Calculates 50/30/20 rule breakdown with customizable proportions
   * @param {number} monthlyIncome 
   * @param {string} mode - 'balanced' | 'aggressive_savings' | 'relaxed'
   * @returns {Object} Categorical allocations and dollar amounts
   */
  static calculate503020(monthlyIncome, mode = 'balanced') {
    const income = Math.max(0, Number(monthlyIncome) || 0);
    let needsRatio = 0.50;
    let wantsRatio = 0.30;
    let savingsRatio = 0.20;

    if (mode === 'aggressive_savings') {
      needsRatio = 0.45;
      wantsRatio = 0.20;
      savingsRatio = 0.35;
    } else if (mode === 'relaxed') {
      needsRatio = 0.55;
      wantsRatio = 0.30;
      savingsRatio = 0.15;
    }

    return {
      totalIncome: income,
      mode,
      needs: {
        percentage: Math.round(needsRatio * 100),
        amount: Math.round(income * needsRatio * 100) / 100,
        categories: ['Housing & Rent', 'Groceries', 'Utilities & Bills', 'Transportation']
      },
      wants: {
        percentage: Math.round(wantsRatio * 100),
        amount: Math.round(income * wantsRatio * 100) / 100,
        categories: ['Dining & Cafes', 'Shopping', 'Entertainment & Tech']
      },
      savings: {
        percentage: Math.round(savingsRatio * 100),
        amount: Math.round(income * savingsRatio * 100) / 100,
        categories: ['Emergency Fund', 'Retirement & Investments', 'Debt Reduction']
      }
    };
  }

  /**
   * Simulates compound growth with monthly recurring additions
   * @param {number} initialPrincipal 
   * @param {number} monthlyAddition 
   * @param {number} annualRatePct 
   * @param {number} years 
   * @returns {Object} Multi-year growth projections
   */
  static simulateCompoundGrowth(initialPrincipal, monthlyAddition, annualRatePct, years) {
    const p = Math.max(0, Number(initialPrincipal) || 0);
    const pmt = Math.max(0, Number(monthlyAddition) || 0);
    const r = (Number(annualRatePct) || 7) / 100 / 12;
    const totalMonths = Math.max(1, Math.min(600, (Number(years) || 5) * 12));

    let balance = p;
    let totalInvested = p;
    const yearlyMilestones = [];

    for (let m = 1; m <= totalMonths; m++) {
      balance = balance * (1 + r) + pmt;
      totalInvested += pmt;

      if (m % 12 === 0) {
        const year = m / 12;
        yearlyMilestones.push({
          year,
          balance: Math.round(balance),
          totalInvested: Math.round(totalInvested),
          interestEarned: Math.round(balance - totalInvested)
        });
      }
    }

    return {
      initialPrincipal: p,
      monthlyAddition: pmt,
      annualRatePct,
      years,
      finalBalance: Math.round(balance * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalInterestEarned: Math.round((balance - totalInvested) * 100) / 100,
      yearlyMilestones
    };
  }

  /**
   * Calculates emergency fund sufficiency and burn runway
   * @param {number} currentSavings 
   * @param {number} monthlyEssentialExpenses 
   * @returns {Object} Runway in months and recommendations
   */
  static calculateEmergencyRunway(currentSavings, monthlyEssentialExpenses) {
    const savings = Math.max(0, Number(currentSavings) || 0);
    const expenses = Math.max(1, Number(monthlyEssentialExpenses) || 1);
    const runwayMonths = Math.round((savings / expenses) * 10) / 10;

    let status = 'critical';
    let targetMonths = 6;
    if (runwayMonths >= 6) status = 'excellent';
    else if (runwayMonths >= 3) status = 'good';
    else if (runwayMonths >= 1) status = 'warning';

    const targetAmount = expenses * targetMonths;
    const gap = Math.max(0, targetAmount - savings);

    return {
      currentSavings: savings,
      monthlyEssentialExpenses: expenses,
      runwayMonths,
      targetMonths,
      targetAmount,
      gap,
      status,
      isFullyFunded: gap === 0
    };
  }

  /**
   * Calculates overall Financial Health Score (0 - 100) and grade
   * @param {Object} data 
   * @returns {Object} Health score, grade, and breakdown
   */
  static evaluateFinancialHealth({ income = 0, expenses = 0, savings = 0, debtPayments = 0 }) {
    let score = 50;
    const totalIncome = Math.max(1, Number(income) || 0);
    const totalExpenses = Math.max(0, Number(expenses) || 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = Math.round((netSavings / totalIncome) * 100);
    const dti = Math.round((Number(debtPayments) / totalIncome) * 100);

    // Savings rate scoring (up to +30 pts)
    if (savingsRate >= 20) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate > 0) score += 10;
    else score -= 25;

    // Debt to Income scoring (up to +15 pts)
    if (dti <= 15) score += 15;
    else if (dti <= 35) score += 5;
    else score -= 15;

    // Emergency reserve buffer (up to +15 pts)
    const runway = totalExpenses > 0 ? (Number(savings) / totalExpenses) : 0;
    if (runway >= 6) score += 15;
    else if (runway >= 3) score += 10;
    else if (runway < 1) score -= 10;

    const clampedScore = Math.min(100, Math.max(10, score));
    let grade = 'B';
    if (clampedScore >= 90) grade = 'A+';
    else if (clampedScore >= 80) grade = 'A';
    else if (clampedScore >= 70) grade = 'B';
    else if (clampedScore >= 60) grade = 'C';
    else if (clampedScore >= 50) grade = 'D';
    else grade = 'F';

    return {
      score: clampedScore,
      grade,
      savingsRate,
      debtToIncomeRatio: dti,
      runwayMonths: Math.round(runway * 10) / 10,
      timestamp: new Date().toISOString()
    };
  }
}
