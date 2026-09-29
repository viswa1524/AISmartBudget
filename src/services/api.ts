import { Transaction, BudgetCategory, SavingsGoal, RecurringBill } from '../types';

export interface BackendDataResponse {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  currency: string;
  updatedAt?: string;
}

export interface BackendHealthResponse {
  status: string;
  uptime: number;
  aiConfigured: boolean;
  timestamp: string;
  database: {
    transactionsCount: number;
    categoriesCount: number;
    goalsCount: number;
    billsCount: number;
  };
  endpoints: string[];
}

/**
 * Checks the connection to the Express Node.js backend.
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[AISmartBudget] Backend health check failed:', err);
    return null;
  }
}

/**
 * Fetches the user's persisted transactions, categories, goals, and bills from the server.
 */
export async function fetchBackendData(): Promise<BackendDataResponse | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('[AISmartBudget] Failed to fetch backend data, falling back to local storage:', err);
    return null;
  }
}

/**
 * Syncs the complete financial state to the persistent backend storage.
 */
export async function syncBackendData(payload: {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  currency: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('[AISmartBudget] Backend sync failed:', err);
    return false;
  }
}

/**
 * Adds a single transaction directly to the backend database.
 */
export async function addBackendTransaction(transaction: Transaction): Promise<boolean> {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction })
    });
    return res.ok;
  } catch (err) {
    console.warn('[AISmartBudget] Failed to add transaction to backend:', err);
    return false;
  }
}

/**
 * Deletes a transaction from the backend database by ID.
 */
export async function deleteBackendTransaction(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[AISmartBudget] Failed to delete transaction on backend:', err);
    return false;
  }
}
