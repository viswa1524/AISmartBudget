import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CornerDownLeft, 
  CheckCircle2, 
  TrendingUp, 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  SlidersHorizontal, 
  PiggyBank, 
  ReceiptText, 
  PieChart, 
  CalendarClock, 
  Plus, 
  Check, 
  RotateCcw
} from 'lucide-react';
import { Transaction, BudgetCategory, SavingsGoal, RecurringBill } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CURRENCIES } from '../data/initialData';

interface HomeTabProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  currency: string;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onUpdateCategory: (id: string, updated: Partial<BudgetCategory>) => void;
  onAddCategory: (cat: Omit<BudgetCategory, 'id'>) => void;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onNavigateTab: (tab: string) => void;
  onOpenCurrencyModal: () => void;
}

interface AssistantResponse {
  id: string;
  query: string;
  intent: string;
  message: string;
  actionData?: any;
  timestamp: string;
  source?: string;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  transactions,
  categories,
  goals,
  bills,
  currency,
  onAddTransaction,
  onUpdateCategory,
  onAddCategory,
  onAddGoal,
  onNavigateTab,
  onOpenCurrencyModal,
}) => {
  const [singleInput, setSingleInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentResponses, setRecentResponses] = useState<AssistantResponse[]>([]);

  // Computed summary
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const currentCurrency = CURRENCIES[currency] || CURRENCIES.USD;

  // Category spending map
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  const handleSingleInputSubmit = async (customPrompt?: string) => {
    const text = customPrompt || singleInput;
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setSingleInput('');

    try {
      const response = await fetch('/api/ai/omni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text.trim(),
          context: {
            currency,
            totalIncome,
            totalExpense,
            netSavings,
            savingsRate,
            categories,
            goals,
            transactions: transactions.slice(0, 15),
          },
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        const { intent, message, transactionData, budgetData, goalData } = res.data;

        // Perform side-effect actions automatically
        if (intent === 'add_transaction' && transactionData) {
          onAddTransaction({
            amount: Number(transactionData.amount) || 0,
            description: transactionData.description || 'Expense Entry',
            type: transactionData.type === 'income' ? 'income' : 'expense',
            category: transactionData.category || 'Shopping',
            paymentMethod: transactionData.paymentMethod || 'credit_card',
            date: transactionData.date || new Date().toISOString().split('T')[0],
            tags: transactionData.tags || ['gemini_entry'],
          });
        } else if (intent === 'set_budget' && budgetData) {
          const existing = categories.find((c) => c.category.toLowerCase() === budgetData.category.toLowerCase());
          if (existing) {
            onUpdateCategory(existing.id, { monthlyLimit: Number(budgetData.monthlyLimit) });
          } else {
            onAddCategory({
              category: budgetData.category,
              monthlyLimit: Number(budgetData.monthlyLimit),
              color: '#3b82f6',
              alertThreshold: 0.85,
            });
          }
        } else if (intent === 'create_goal' && goalData) {
          onAddGoal({
            title: goalData.title,
            targetAmount: Number(goalData.targetAmount),
            currentAmount: 0,
            deadline: goalData.deadline || '2026-12-31',
            category: goalData.category || 'Savings',
            color: '#10b981',
          });
        }

        const newResp: AssistantResponse = {
          id: 'omni-' + Date.now(),
          query: text.trim(),
          intent,
          message,
          actionData: transactionData || budgetData || goalData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.source,
        };

        setRecentResponses((prev) => [newResp, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      console.error('[AISmartBudget] Single input handler error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const samplePrompts = [
    "Spent $18.50 on lunch at Chipotle",
    "Got $850 freelance design payment",
    "How much have I spent on Dining this month?",
    "Where can I cut expenses to save $250?",
    "Set Groceries budget to $500",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Hero Welcome & Status Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini 3.8 Flash Financial Assistant Ready</span>
          <span className="text-slate-600">•</span>
          <button
            onClick={onOpenCurrencyModal}
            className="hover:text-emerald-400 transition flex items-center space-x-1"
          >
            <span>{currentCurrency.flag} {currentCurrency.code}</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          What would you like to do with your budget?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Type any transaction, financial question, or budget command in natural language below.
        </p>
      </div>

      {/* SINGLE INPUT TAB (Central Gemini Assistant Bar) */}
      <div className="relative">
        <div className="relative rounded-2xl bg-slate-900/90 border-2 border-slate-800 hover:border-emerald-500/40 focus-within:border-emerald-500 shadow-xl shadow-black/50 transition-all p-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSingleInputSubmit();
            }}
            className="flex items-center space-x-2"
          >
            <div className="pl-3 text-emerald-400">
              <Sparkles className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
            </div>

            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              placeholder="e.g. 'Spent $42 at Whole Foods', 'How is my savings rate?', 'Set Dining to $300'..."
              disabled={isProcessing}
              className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 px-2 py-3 focus:outline-none font-medium"
              autoFocus
            />

            <button
              type="submit"
              disabled={!singleInput.trim() || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span>{isProcessing ? 'Thinking...' : 'Run'}</span>
              <CornerDownLeft className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="px-3 pt-2 pb-1 border-t border-slate-800/80 mt-1 flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-slate-500 font-semibold text-[10px] uppercase shrink-0 mr-1">Quick prompts:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSingleInputSubmit(p)}
                disabled={isProcessing}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Responses Feed */}
      {recentResponses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Recent Gemini Assistant Activity</span>
            <button
              onClick={() => setRecentResponses([])}
              className="text-slate-500 hover:text-slate-400 normal-case font-normal text-[11px]"
            >
              Clear activity
            </button>
          </div>

          <div className="space-y-2.5">
            {recentResponses.map((res) => (
              <div
                key={res.id}
                className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2 shadow-sm animate-in fade-in duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {res.intent.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 italic truncate max-w-xs sm:max-w-md">
                      "{res.query}"
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{res.timestamp}</span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {res.message}
                </p>

                {res.actionData && (
                  <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-400/90 font-mono">
                    <span className="flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ledger synchronized automatically</span>
                    </span>
                    <button
                      onClick={() => onNavigateTab('transactions')}
                      className="text-slate-400 hover:text-white underline"
                    >
                      View in ledger ↗
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Financial Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Monthly Inflow</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalIncome, currency)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">2 regular deposits</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Monthly Outflow</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalExpense, currency)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{transactions.filter(t => t.type === 'expense').length} expenses logged</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Net Surplus</span>
          <p className={`text-lg sm:text-xl font-bold font-mono mt-1 ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netSavings, currency)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Liquid cash buffer</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block">Savings Rate</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
            {savingsRate}%
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">Healthy (Target: 20%)</span>
        </div>
      </div>

      {/* Quick Category Progress Glance */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Category Budgets at a Glance</h3>
            <p className="text-[11px] text-slate-400">Current monthly spending compared to assigned limits</p>
          </div>
          <button
            onClick={() => onNavigateTab('budget')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Open Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.slice(0, 4).map((cat) => {
            const spent = categorySpending[cat.category] || 0;
            const percent = cat.monthlyLimit > 0 ? Math.min(100, Math.round((spent / cat.monthlyLimit) * 100)) : 0;
            const isOver = spent > cat.monthlyLimit;

            return (
              <div key={cat.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-slate-200">{cat.category}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    <strong className={isOver ? 'text-rose-400' : 'text-slate-200'}>
                      {formatCurrency(spent, currency)}
                    </strong>
                    <span> / {formatCurrency(cat.monthlyLimit, currency)}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Exploration Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateTab('dashboard')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition space-y-1.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
              Full Dashboard
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
          <p className="text-[11px] text-slate-400">Complete visual KPIs &amp; meters</p>
        </button>

        <button
          onClick={() => onNavigateTab('transactions')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition space-y-1.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
              Transactions
            </span>
            <ReceiptText className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
          <p className="text-[11px] text-slate-400">{transactions.length} records • Search &amp; CSV</p>
        </button>

        <button
          onClick={() => onNavigateTab('ai-assistant')}
          className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition space-y-1.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">
              AI Audit Report
            </span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400">In-depth financial health grade</p>
        </button>
      </div>
    </div>
  );
};
