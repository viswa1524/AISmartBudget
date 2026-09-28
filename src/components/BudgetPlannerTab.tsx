import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  PieChart as PieIcon,
  Trash2,
  Edit2
} from 'lucide-react';
import { BudgetCategory, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CURRENCIES } from '../data/initialData';

interface BudgetPlannerTabProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
  currency: string;
  onUpdateCategory: (id: string, updated: Partial<BudgetCategory>) => void;
  onAddCategory: (cat: Omit<BudgetCategory, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onOpenSmartBudgetModal: () => void;
}

export const BudgetPlannerTab: React.FC<BudgetPlannerTabProps> = ({
  categories,
  transactions,
  currency,
  onUpdateCategory,
  onAddCategory,
  onDeleteCategory,
  onOpenSmartBudgetModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState<number>(0);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState<number>(300);
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate actual spending per category this month
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  const totalBudget = categories.reduce((sum, c) => sum + c.monthlyLimit, 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, v) => sum + v, 0);
  const totalVariance = totalBudget - totalSpent;

  const rate = CURRENCIES[currency]?.rate || 1.0;

  const handleStartEdit = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditLimit(Math.round(cat.monthlyLimit * rate));
  };

  const handleSaveEdit = (id: string) => {
    onUpdateCategory(id, { monthlyLimit: Number(editLimit) / rate });
    setEditingId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onAddCategory({
      category: newCategoryName.trim(),
      monthlyLimit: (Number(newCategoryLimit) || 200) / rate,
      color: randomColor,
      alertThreshold: 0.85,
    });
    setNewCategoryName('');
    setNewCategoryLimit(300);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Plan Generator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Monthly Budget Planner</h2>
          <p className="text-xs text-slate-400">Establish spending caps per category to enforce savings discipline</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenSmartBudgetModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>AI 50/30/20 Generator</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Aggregate Budget Envelope Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total Planned Limit</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(totalBudget, currency)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Sum of all {categories.length} category caps</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Actual Monthly Spend</span>
          <p className="text-xl font-bold font-mono text-slate-200 mt-1">{formatCurrency(totalSpent, currency)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of allocated budget utilized
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Remaining Budget Buffer</span>
          <p className={`text-xl font-bold font-mono mt-1 ${totalVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalVariance, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalVariance >= 0 ? 'Comfortably within monthly bounds' : 'Total spending exceeds planned envelope!'}
          </p>
        </div>
      </div>

      {/* Add New Category Form (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleCreateCategory} className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Add Custom Budget Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Pet Care, Education, Gaming"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Monthly Spending Limit ({currency})</label>
              <input
                type="number"
                min="10"
                step="10"
                required
                value={newCategoryLimit}
                onChange={(e) => setNewCategoryLimit(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                Save Category
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const spent = categorySpending[cat.category] || 0;
          const ratio = cat.monthlyLimit > 0 ? spent / cat.monthlyLimit : 0;
          const percentage = Math.min(100, Math.round(ratio * 100));
          const remaining = cat.monthlyLimit - spent;
          const isOver = spent > cat.monthlyLimit;
          const isWarning = !isOver && ratio >= cat.alertThreshold;

          return (
            <div
              key={cat.id}
              className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{cat.category}</h4>
                    <p className="text-[10px] text-slate-400">
                      Alert trigger at {Math.round(cat.alertThreshold * 100)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit category limit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Edit Mode Inline */}
              {editingId === cat.id ? (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    value={editLimit}
                    onChange={(e) => setEditLimit(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 text-slate-100 text-xs px-2.5 py-1.5 rounded border border-slate-700 font-mono w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <div className="space-x-1">
                    <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-slate-100'}`}>
                      {formatCurrency(spent, currency)}
                    </span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{formatCurrency(cat.monthlyLimit, currency)}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${
                    isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              )}

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Footnote status */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                {isOver ? (
                  <span className="text-rose-400 font-semibold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Exceeded by {formatCurrency(Math.abs(remaining), currency)}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {formatCurrency(remaining, currency)} remaining this month
                  </span>
                )}
                <span className="text-[10px] text-slate-500">
                  {transactions.filter(t => t.category === cat.category && t.type === 'expense').length} transactions
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
