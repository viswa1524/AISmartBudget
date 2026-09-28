export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'digital_wallet';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
}

export interface BudgetCategory {
  id: string;
  category: string;
  monthlyLimit: number;
  color: string;
  alertThreshold: number; // e.g. 0.8 for 80%
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  category: string;
  color: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  dueDay: number; // 1-31
  category: string;
  autoPaid: boolean;
  isActive: boolean;
}

export interface FinancialAuditReport {
  overallScore: number;
  healthGrade: string;
  summary: string;
  savingsRate: number;
  monthlyBurnRate: number;
  projectedRunwayMonths?: number;
  keyStrengths: string[];
  criticalRisks: string[];
  recommendedActions: {
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    description: string;
    potentialSavings: number;
  }[];
  budgetAdjustments: {
    category: string;
    currentSpending: number;
    recommendedLimit: number;
    action: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: { label: string; action: string; payload?: any }[];
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  country: string;
  name: string;
  flag: string;
  rate: number; // Relative to USD
}
