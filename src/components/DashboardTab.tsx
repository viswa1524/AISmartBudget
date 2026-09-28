import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  PlusCircle,
  Clock
} from 'lucide-react';
import { Transaction, BudgetCategory, SavingsGoal, RecurringBill } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardTabProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  currency: string;
  onNavigateTab: (tab: string) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  transactions,
  categories,
  goals,
  bills,
  currency,
  onNavigateTab,
  onOpenAddModal,
  onOpenScanModal,
}) => {
  // Compute monthly totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Spending per category
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  // Recent 6 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Total allocated budget
  const totalBudgetLimit = categories.reduce((acc, c) => acc + c.monthlyLimit, 0);
  const totalBudgetUsedPercent = totalBudgetLimit > 0 ? Math.min(100, Math.round((totalExpense / totalBudgetLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* AI Smart Insight Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/40 border border-emerald-500/30 p-5 shadow-lg shadow-black/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Financial Health Pulse</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Grade A-
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                Your monthly cash flow is trending positive ({savingsRate}% savings rate).
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                Dining and retail shopping represent 28% of total expenses. Run the AI Advisor to discover opportunities to save an extra ~{formatCurrency(240, currency)} this month.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigateTab('ai-assistant')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5"
            >
              <span>View AI Audit Report</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenScanModal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              Scan Receipt
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Monthly Inflow</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>2 recurring payrolls + consulting</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Monthly Outflow</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(totalExpense, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-400">
            <span>{totalBudgetUsedPercent}% of monthly budget cap used</span>
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Net Monthly Surplus</span>
            <div className={`p-2 rounded-lg ${netSavings >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black tracking-tight ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netSavings, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-400">
            <span>Added directly to emergency &amp; goals</span>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Savings Rate</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {savingsRate}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Target: 20%+</span>
          </div>
          {/* Progress Mini Bar */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${savingsRate >= 20 ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (savingsRate / 40) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left 2 Cols (Budget Meters + Recent Transactions) | Right 1 Col (Goals + Bills) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Budget Status & Quick Transactions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Budget Categories Progress */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Category Budgets</h3>
                <p className="text-xs text-slate-400">Real-time spend against planned monthly limits</p>
              </div>
              <button
                onClick={() => onNavigateTab('budget')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <span>Customize Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {categories.slice(0, 5).map((cat) => {
                const spent = categorySpending[cat.category] || 0;
                const ratio = cat.monthlyLimit > 0 ? spent / cat.monthlyLimit : 0;
                const percent = Math.min(100, Math.round(ratio * 100));
                const isOver = spent > cat.monthlyLimit;
                const isWarning = !isOver && ratio >= cat.alertThreshold;

                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: cat.color }} 
                        />
                        <span className="font-semibold text-slate-200">{cat.category}</span>
                        {isOver && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-0.5">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> Over Budget
                          </span>
                        )}
                        {isWarning && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Near Limit
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-slate-400 text-xs">
                        <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-slate-200'}`}>
                          {formatCurrency(spent, currency)}
                        </span>
                        <span> / {formatCurrency(cat.monthlyLimit, currency)}</span>
                        <span className="text-slate-500 ml-1.5">({percent}%)</span>
                      </div>
                    </div>
                    {/* Meter bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                <p className="text-xs text-slate-400">Latest entries from all accounts and sources</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAddModal}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition"
                >
                  + Add
                </button>
                <button
                  onClick={() => onNavigateTab('transactions')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-0.5"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      tx.type === 'income' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}>
                      {tx.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">{tx.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold font-mono ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </span>
                    <p className="text-[10px] text-slate-500 capitalize">{tx.paymentMethod.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Savings Goals & Upcoming Bills */}
        <div className="space-y-6">

          {/* Active Savings Goals Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Savings Targets</h3>
                <p className="text-xs text-slate-400">Goals &amp; dedicated funds</p>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Manage
              </button>
            </div>

            <div className="space-y-4">
              {goals.slice(0, 3).map((g) => {
                const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return (
                  <div key={g.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{g.title}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{formatCurrency(g.currentAmount, currency)}</span>
                      <span>Target: {formatCurrency(g.targetAmount, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring Bills Alert Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Scheduled Bills</h3>
                <p className="text-xs text-slate-400">Upcoming payments this cycle</p>
              </div>
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                All Bills
              </button>
            </div>

            <div className="space-y-2.5">
              {bills.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300 font-mono">
                      {b.dueDay}th
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{b.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{b.frequency} • {b.autoPaid ? 'Autopay ON' : 'Manual'}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    {formatCurrency(b.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Advisor Prompt Widget */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900 to-emerald-950/30 border border-emerald-500/20 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-white">Ask AI Financial Advisor</h4>
            <p className="text-[11px] text-slate-400">
              Get personalized answers on debt payoff, investment allocations, or budget trimming.
            </p>
            <button
              onClick={() => onNavigateTab('ai-assistant')}
              className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
            >
              Start Conversation
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
