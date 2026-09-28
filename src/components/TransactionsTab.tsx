import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  ScanLine, 
  Tag,
  CheckSquare,
  Square
} from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TransactionsTabProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  currency: string;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, tx: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  categories,
  currency,
  onDeleteTransaction,
  onOpenAddModal,
  onOpenScanModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = selectedType === 'all' || t.type === selectedType;
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;

      return matchSearch && matchType && matchCategory;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, searchTerm, selectedType, selectedCategory, sortBy]);

  // Aggregate subtotal for visible transactions
  const filteredInflow = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const filteredOutflow = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  // CSV export handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Description', 'Amount', 'Type', 'Category', 'PaymentMethod', 'Tags'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      `"${t.category}"`,
      t.paymentMethod,
      `"${(t.tags || []).join(';')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AISmartBudget_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) {
      selectedIds.forEach((id) => onDeleteTransaction(id));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Transactions Ledger</h2>
          <p className="text-xs text-slate-400">Search, filter, and audit every item of income and expense</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenScanModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Parser</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search text input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, tag, or store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="all">All Types (Income &amp; Expense)</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Inflow Only</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="all">All Categories</option>
            <option value="Income">Income</option>
            {categories.map((c) => (
              <option key={c.id} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>

          {/* Sort order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        {/* Aggregate Subtotal Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Showing <strong className="text-white">{filteredTransactions.length}</strong> transactions</span>
          <div className="flex items-center space-x-4 font-mono">
            <span>Inflow: <strong className="text-emerald-400">{formatCurrency(filteredInflow, currency)}</strong></span>
            <span>Outflow: <strong className="text-rose-400">{formatCurrency(filteredOutflow, currency)}</strong></span>
            <span>Net: <strong className={filteredInflow >= filteredOutflow ? 'text-emerald-400' : 'text-rose-400'}>
              {formatCurrency(filteredInflow - filteredOutflow, currency)}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No transactions match your current search and filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isSelected = selectedIds.has(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-slate-800/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(tx.id)}
                          className="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center space-x-1.5">
                          <span>{tx.description}</span>
                          {tx.isRecurring && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Recurring
                            </span>
                          )}
                        </div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tx.tags.map((tg) => (
                              <span
                                key={tg}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono"
                              >
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 capitalize text-[11px]">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-xs">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete transaction "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Delete transaction"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
