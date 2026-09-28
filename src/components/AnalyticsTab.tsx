import React, { useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Flame,
  Clock
} from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AnalyticsTabProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  currency: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  transactions,
  categories,
  currency,
}) => {
  // Aggregate expenses by category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
        totalExpense += tx.amount;
      }
    });

    const list = Object.entries(map).map(([category, amount]) => {
      const catConfig = categories.find((c) => c.category === category);
      const color = catConfig?.color || '#94a3b8';
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return { category, amount, percentage, color };
    });

    list.sort((a, b) => b.amount - a.amount);
    return { list, totalExpense };
  }, [transactions, categories]);

  // Aggregate by payment method
  const paymentStats = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const method = tx.paymentMethod || 'other';
        map[method] = (map[method] || 0) + tx.amount;
        total += tx.amount;
      }
    });
    return Object.entries(map).map(([method, amount]) => ({
      method,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));
  }, [transactions]);

  // Total income vs expense
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = categoryStats.totalExpense;
  const netSavings = totalIncome - totalExpense;
  const dailyBurn = Math.round(totalExpense / 30);

  // Simple SVG Donut Chart calculation
  let cumulativePercent = 0;
  const donutSegments = categoryStats.list.map((item) => {
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += item.percentage;
    const endAngle = (cumulativePercent / 100) * 360;
    return {
      ...item,
      startAngle,
      endAngle,
    };
  });

  // Helper for SVG path
  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Financial Analytics &amp; Visualizations</h2>
        <p className="text-xs text-slate-400">Deep-dive into expense breakdowns, spending velocity, and payment distribution</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Daily Burn Rate</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{formatCurrency(dailyBurn, currency)} / day</p>
            <p className="text-[11px] text-slate-500">Based on 30-day baseline</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Monthly Net Accumulation</span>
            <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{formatCurrency(netSavings, currency)}</p>
            <p className="text-[11px] text-slate-500">
              {totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0}% retained cash
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Top Expense Driver</span>
            <p className="text-lg font-bold text-white mt-0.5 truncate">
              {categoryStats.list[0]?.category || 'None'}
            </p>
            <p className="text-[11px] text-slate-500">
              {categoryStats.list[0] ? `${categoryStats.list[0].percentage.toFixed(1)}% of total outflow` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Main Visualizations: Donut Breakdown + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown Donut */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Expense Distribution by Category</h3>
            <span className="text-xs font-mono text-slate-400">
              Total: {formatCurrency(totalExpense, currency)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {donutSegments.length === 0 ? (
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#334155" strokeWidth="18" />
                ) : (
                  donutSegments.map((seg, idx) => {
                    // Dasharray calculation for circle
                    const circumference = 2 * Math.PI * 32;
                    const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                    let accumulated = 0;
                    for (let i = 0; i < idx; i++) {
                      accumulated += donutSegments[i].percentage;
                    }
                    const strokeDashoffset = -((accumulated / 100) * circumference);

                    return (
                      <circle
                        key={seg.category}
                        cx="50"
                        cy="50"
                        r="32"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Outflow</span>
                <span className="text-xs font-bold font-mono text-white">
                  {formatCurrency(totalExpense, currency)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categoryStats.list.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 truncate">{item.category}</span>
                  </div>
                  <div className="font-mono text-right shrink-0 space-x-2 text-[11px]">
                    <span className="text-slate-100 font-semibold">{formatCurrency(item.amount, currency)}</span>
                    <span className="text-slate-500">({item.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods & Flow Breakdown */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Outflow by Payment Channel</h3>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 pt-2">
            {paymentStats.map((p) => {
              const formattedName = p.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={p.method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{formattedName}</span>
                    <span className="font-mono text-slate-400 text-xs font-bold">
                      {formatCurrency(p.amount, currency)} ({p.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cash flow health comparison */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Monthly Inflow vs Outflow Ratio
            </h4>
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Total Monthly Income</span>
                <p className="text-sm font-bold font-mono text-emerald-400">{formatCurrency(totalIncome, currency)}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Total Monthly Spend</span>
                <p className="text-sm font-bold font-mono text-rose-400">{formatCurrency(totalExpense, currency)}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
