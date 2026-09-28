import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Repeat, 
  ShieldCheck, 
  ShieldAlert
} from 'lucide-react';
import { RecurringBill } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RecurringBillsTabProps {
  bills: RecurringBill[];
  currency: string;
  onAddBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onUpdateBill: (id: string, updated: Partial<RecurringBill>) => void;
  onDeleteBill: (id: string) => void;
}

export const RecurringBillsTab: React.FC<RecurringBillsTabProps> = ({
  bills,
  currency,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(30);
  const [dueDay, setDueDay] = useState<number>(1);
  const [category, setCategory] = useState('Utilities & Bills');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [autoPaid, setAutoPaid] = useState(true);

  // Normalize all to monthly equivalent
  const monthlyTotal = bills
    .filter((b) => b.isActive)
    .reduce((sum, b) => {
      if (b.frequency === 'yearly') return sum + b.amount / 12;
      if (b.frequency === 'weekly') return sum + b.amount * 4.33;
      return sum + b.amount;
    }, 0);

  const annualTotal = monthlyTotal * 12;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddBill({
      name: name.trim(),
      amount: Number(amount),
      frequency,
      dueDay: Number(dueDay),
      category,
      autoPaid,
      isActive: true,
    });
    setName('');
    setAmount(30);
    setDueDay(1);
    setShowAddModal(false);
  };

  // Sort bills by due day
  const sortedBills = [...bills].sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Subscriptions &amp; Recurring Commitments</h2>
          <p className="text-xs text-slate-400">Audit recurring overhead, payment calendars, and auto-renewals</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Bill</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Monthly Committed Cost</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(monthlyTotal, currency)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Normalized to single monthly billing cycle</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Annual Fixed Projection</span>
          <p className="text-xl font-bold font-mono text-slate-200 mt-1">{formatCurrency(annualTotal, currency)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Yearly committed cost if unchanged</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Active Subscriptions</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{bills.filter(b => b.isActive).length} Active</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {bills.filter(b => b.autoPaid).length} configured with Autopay
          </p>
        </div>
      </div>

      {/* Bills Timeline & Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Monthly Schedule (Ordered by Due Day)</h3>
          <span className="text-xs text-slate-400">{sortedBills.length} registered services</span>
        </div>

        <div className="divide-y divide-slate-800/80 text-xs">
          {sortedBills.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No recurring bills added yet.
            </div>
          ) : (
            sortedBills.map((b) => (
              <div
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Day</span>
                    <span className="text-sm font-black text-slate-200">{b.dueDay}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-xs">{b.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono capitalize">
                        {b.frequency}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                      <span>{b.category}</span>
                      <span>•</span>
                      <button
                        onClick={() => onUpdateBill(b.id, { autoPaid: !b.autoPaid })}
                        className={`flex items-center space-x-1 font-medium transition ${
                          b.autoPaid ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {b.autoPaid ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        <span>{b.autoPaid ? 'Autopay Enabled' : 'Manual Remind'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white">
                      {formatCurrency(b.amount, currency)}
                    </span>
                    <p className="text-[10px] text-slate-500 capitalize">per {b.frequency === 'yearly' ? 'year' : 'month'}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete subscription "${b.name}"?`)) {
                        onDeleteBill(b.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Add Recurring Subscription / Bill</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service or Bill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Rent, Spotify, Broadband"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Day of Month (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Billing Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Housing & Rent">Housing &amp; Rent</option>
                    <option value="Utilities & Bills">Utilities &amp; Bills</option>
                    <option value="Entertainment & Tech">Entertainment &amp; Tech</option>
                    <option value="Health & Fitness">Health &amp; Fitness</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-1 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autopay"
                  checked={autoPaid}
                  onChange={(e) => setAutoPaid(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="autopay" className="text-xs text-slate-300 cursor-pointer select-none">
                  Autopay is enabled on account
                </label>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Save Subscription
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
