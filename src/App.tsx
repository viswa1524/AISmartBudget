import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeTab } from './components/HomeTab';
import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetPlannerTab } from './components/BudgetPlannerTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SavingsGoalsTab } from './components/SavingsGoalsTab';
import { RecurringBillsTab } from './components/RecurringBillsTab';
import { AiAssistantTab } from './components/AiAssistantTab';
import { TransactionModal } from './components/TransactionModal';
import { SmartReceiptModal } from './components/SmartReceiptModal';
import { SmartBudgetModal } from './components/SmartBudgetModal';
import { CurrencyModal } from './components/CurrencyModal';

import { 
  Transaction, 
  BudgetCategory, 
  SavingsGoal, 
  RecurringBill 
} from './types';

import { 
  DEFAULT_BUDGET_CATEGORIES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_RECURRING_BILLS 
} from './data/initialData';

import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logoutGoogle } from './services/googleAuth';
import { exportBudgetToGoogleSheets } from './services/googleSheets';

export function App() {
  // Persisted state with local storage fallback
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('aisb_currency') || 'USD';
  });

  const [activeTab, setActiveTab] = useState<string>('home');

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('aisb_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    const saved = localStorage.getItem('aisb_categories');
    return saved ? JSON.parse(saved) : DEFAULT_BUDGET_CATEGORIES;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('aisb_goals');
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
  });

  const [bills, setBills] = useState<RecurringBill[]>(() => {
    const saved = localStorage.getItem('aisb_bills');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_BILLS;
  });

  // Google Workspace auth & sync state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Listen for Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setSpreadsheetUrl(null);
  };

  const handleSyncSheets = async () => {
    if (!googleUser) {
      handleGoogleSignIn();
      return;
    }
    setIsSyncingSheets(true);
    setSyncStatus(null);
    try {
      const res = await exportBudgetToGoogleSheets(transactions, categories, currency);
      setSpreadsheetUrl(res.spreadsheetUrl);
      setSyncStatus(`Successfully exported to Google Sheets!`);
    } catch (err: any) {
      console.error('Sheets export error:', err);
      setSyncStatus(`Sync error: ${err.message || 'Failed to export'}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('aisb_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('aisb_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('aisb_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('aisb_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('aisb_bills', JSON.stringify(bills));
  }, [bills]);

  // Handlers for Transactions
  const handleAddTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUpdateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Categories
  const handleUpdateCategory = (id: string, updated: Partial<BudgetCategory>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleAddCategory = (cat: Omit<BudgetCategory, 'id'>) => {
    const newCat: BudgetCategory = {
      ...cat,
      id: 'cat-' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleApplyBudgetPlan = (newCategories: BudgetCategory[]) => {
    setCategories(newCategories);
  };

  // Handlers for Goals
  const handleAddGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: 'goal-' + Date.now(),
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleUpdateGoal = (id: string, updated: Partial<SavingsGoal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updated } : g))
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Handlers for Bills
  const handleAddBill = (bill: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = {
      ...bill,
      id: 'bill-' + Date.now(),
    };
    setBills((prev) => [...prev, newBill]);
  };

  const handleUpdateBill = (id: string, updated: Partial<RecurringBill>) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
  };

  const handleDeleteBill = (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Calculations for summary stats
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        netSavings={netSavings}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onSyncSheets={handleSyncSheets}
        isSyncingSheets={isSyncingSheets}
        spreadsheetUrl={spreadsheetUrl}
      />

      {/* Sync Notification Banner if active */}
      {syncStatus && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 text-center text-xs text-emerald-300 flex items-center justify-center space-x-2">
          <span>{syncStatus}</span>
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-white hover:text-emerald-200"
            >
              Open in Google Sheets ↗
            </a>
          )}
          <button
            onClick={() => setSyncStatus(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <HomeTab
            transactions={transactions}
            categories={categories}
            goals={goals}
            bills={bills}
            currency={currency}
            onAddTransaction={handleAddTransaction}
            onUpdateCategory={handleUpdateCategory}
            onAddCategory={handleAddCategory}
            onAddGoal={handleAddGoal}
            onNavigateTab={setActiveTab}
            onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            transactions={transactions}
            categories={categories}
            goals={goals}
            bills={bills}
            currency={currency}
            onNavigateTab={setActiveTab}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanModal={() => setIsScanModalOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            categories={categories}
            currency={currency}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanModal={() => setIsScanModalOpen(true)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetPlannerTab
            categories={categories}
            transactions={transactions}
            currency={currency}
            onUpdateCategory={handleUpdateCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onOpenSmartBudgetModal={() => setIsBudgetModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            transactions={transactions}
            categories={categories}
            currency={currency}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoalsTab
            goals={goals}
            currency={currency}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'bills' && (
          <RecurringBillsTab
            bills={bills}
            currency={currency}
            onAddBill={handleAddBill}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AiAssistantTab
            transactions={transactions}
            categories={categories}
            goals={goals}
            currency={currency}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddTransaction}
        categories={categories}
        currency={currency}
      />

      <SmartReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onConfirm={handleAddTransaction}
        categories={categories}
        currency={currency}
      />

      <SmartBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onApplyPlan={handleApplyBudgetPlan}
        currentIncome={totalIncome}
        currency={currency}
      />

      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        selectedCurrency={currency}
        onSelectCurrency={setCurrency}
      />
    </div>
  );
}

export default App;
