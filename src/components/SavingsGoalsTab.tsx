import React, { useState } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Target, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Trash2,
  DollarSign
} from 'lucide-react';
import { SavingsGoal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CURRENCIES } from '../data/initialData';

interface SavingsGoalsTabProps {
  goals: SavingsGoal[];
  currency: string;
  onUpdateGoal: (id: string, updated: Partial<SavingsGoal>) => void;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsGoalsTab: React.FC<SavingsGoalsTabProps> = ({
  goals,
  currency,
  onUpdateGoal,
  onAddGoal,
  onDeleteGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(100);

  // New Goal State
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState<number>(5000);
  const [newInitial, setNewInitial] = useState<number>(500);
  const [newDeadline, setNewDeadline] = useState('2026-12-31');
  const [newCategory, setNewCategory] = useState('Emergency');

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const aggregatePercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const rate = CURRENCIES[currency]?.rate || 1.0;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId || depositAmount <= 0) return;
    const goal = goals.find((g) => g.id === depositGoalId);
    if (goal) {
      onUpdateGoal(depositGoalId, {
        currentAmount: goal.currentAmount + (Number(depositAmount) / rate),
      });
    }
    setDepositGoalId(null);
    setDepositAmount(100);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onAddGoal({
      title: newTitle.trim(),
      targetAmount: Number(newTarget) / rate,
      currentAmount: Number(newInitial) / rate,
      deadline: newDeadline,
      category: newCategory,
      color: randomColor,
    });

    setNewTitle('');
    setNewTarget(5000);
    setNewInitial(500);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Savings Targets &amp; Sinking Funds</h2>
          <p className="text-xs text-slate-400">Ring-fence capital for long-term purchases, emergencies, and investments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Target</span>
        </button>
      </div>

      {/* Aggregate Savings Status */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Capital Dedicated to Goals</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(totalSaved, currency)}
              </span>
              <span className="text-xs font-mono text-slate-500">
                / {formatCurrency(totalTarget, currency)} total goal
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 font-mono text-sm">{aggregatePercentage}% Funded</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${aggregatePercentage}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isComplete = goal.currentAmount >= goal.targetAmount;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
                    <h3 className="text-sm font-bold text-white">{goal.title}</h3>
                  </div>
                  <span className="inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                    {goal.category}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress and numbers */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-white text-base">
                      {formatCurrency(goal.currentAmount, currency)}
                    </span>
                    <span className="text-slate-500 text-xs ml-1">
                      / {formatCurrency(goal.targetAmount, currency)}
                    </span>
                  </div>
                  <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {percent}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: goal.color || '#10b981',
                    }}
                  />
                </div>
              </div>

              {/* Deadline & Remaining */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target: {formatDate(goal.deadline)}</span>
                </div>
                <span className="font-mono text-[11px]">
                  {isComplete ? (
                    <span className="text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Goal Achieved!
                    </span>
                  ) : (
                    <span>{formatCurrency(remaining, currency)} to go</span>
                  )}
                </span>
              </div>

              {/* Action: Add contribution */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setDepositGoalId(goal.id);
                    setDepositAmount(100);
                  }}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Contribute Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribution Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Deposit to Savings Goal</h3>
            <p className="text-xs text-slate-400">
              Allocate money towards {goals.find(g => g.id === depositGoalId)?.title}
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Deposit Amount ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 text-slate-100 text-sm font-mono rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Confirm Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Savings Target</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding, House Downpayment, Laptop"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Amount ({currency})</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Balance ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={newInitial}
                    onChange={(e) => setNewInitial(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="Travel">Travel</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Tech">Tech</option>
                    <option value="Investments">Investments</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Create Target
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
