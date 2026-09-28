import React, { useState } from 'react';
import { X, Sparkles, Check, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { BudgetCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SmartBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (newCategories: BudgetCategory[]) => void;
  currentIncome: number;
  currency: string;
}

export const SmartBudgetModal: React.FC<SmartBudgetModalProps> = ({
  isOpen,
  onClose,
  onApplyPlan,
  currentIncome,
  currency,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(currentIncome || 5000);
  const [style, setStyle] = useState<'balanced' | 'aggressive_savings' | 'flexible_lifestyle'>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planResult, setPlanResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPlanResult(null);

    try {
      const response = await fetch('/api/ai/generate-budget-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome,
          style,
          currency,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        setPlanResult(res.data);
      }
    } catch (err) {
      console.error('[AISmartBudget] Generate budget plan error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!planResult || !planResult.categories) return;
    const formattedCategories: BudgetCategory[] = planResult.categories.map((c: any, index: number) => ({
      id: 'cat-plan-' + index + '-' + Date.now(),
      category: c.category,
      monthlyLimit: c.monthlyLimit,
      color: c.color || '#3b82f6',
      alertThreshold: c.alertThreshold || 0.85,
    }));

    onApplyPlan(formattedCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI 50/30/20 Budget Architect</h3>
              <p className="text-[10px] text-slate-400">Generate mathematically disciplined monthly envelopes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Estimated Monthly Net Take-Home Income ({currency})
            </label>
            <input
              type="number"
              min="500"
              step="100"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 text-slate-100 text-sm font-mono rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Financial Strategy Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStyle('balanced')}
                className={`p-3 rounded-xl border text-left transition ${
                  style === 'balanced'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Standard 50/30/20</span>
                <span className="text-[10px] text-slate-400 mt-1 block">50% Needs, 30% Wants, 20% Savings</span>
              </button>

              <button
                type="button"
                onClick={() => setStyle('aggressive_savings')}
                className={`p-3 rounded-xl border text-left transition ${
                  style === 'aggressive_savings'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Aggressive Saver</span>
                <span className="text-[10px] text-slate-400 mt-1 block">45% Needs, 20% Wants, 35% Savings</span>
              </button>

              <button
                type="button"
                onClick={() => setStyle('flexible_lifestyle')}
                className={`p-3 rounded-xl border text-left transition ${
                  style === 'flexible_lifestyle'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Lifestyle First</span>
                <span className="text-[10px] text-slate-400 mt-1 block">50% Needs, 35% Wants, 15% Savings</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Computing Optimal Envelope...' : 'Generate Budget Proposal'}</span>
          </button>
        </div>

        {/* Plan Preview */}
        {planResult && (
          <div className="pt-2 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] text-blue-400 font-semibold uppercase block">Needs ({planResult.breakdown.needs.percentage}%)</span>
                <span className="font-mono font-bold text-white text-sm">{formatCurrency(planResult.breakdown.needs.amount, currency)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-semibold uppercase block">Wants ({planResult.breakdown.wants.percentage}%)</span>
                <span className="font-mono font-bold text-white text-sm">{formatCurrency(planResult.breakdown.wants.amount, currency)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Savings ({planResult.breakdown.savings.percentage}%)</span>
                <span className="font-mono font-bold text-white text-sm">{formatCurrency(planResult.breakdown.savings.amount, currency)}</span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Calculated Category Allocations
              </span>
              {planResult.categories.map((c: any) => (
                <div key={c.category} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-200 font-medium">{c.category}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{formatCurrency(c.monthlyLimit, currency)} / mo</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20"
            >
              <span>Apply This Budget Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
