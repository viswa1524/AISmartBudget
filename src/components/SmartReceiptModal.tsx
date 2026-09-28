import React, { useState } from 'react';
import { X, Sparkles, ScanLine, Check, ArrowRight } from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SmartReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tx: Omit<Transaction, 'id'>) => void;
  categories: BudgetCategory[];
  currency: string;
}

export const SmartReceiptModal: React.FC<SmartReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categories,
  currency,
}) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParsedData(null);

    try {
      const response = await fetch('/api/ai/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          currentDate: new Date().toISOString().split('T')[0],
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        setParsedData(res.data);
      }
    } catch (err) {
      console.error('[AISmartBudget] Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    onConfirm({
      description: parsedData.description || 'Parsed Item',
      amount: Number(parsedData.amount) || 0,
      type: parsedData.type === 'income' ? 'income' : 'expense',
      category: parsedData.category || 'Shopping',
      paymentMethod: parsedData.paymentMethod || 'credit_card',
      date: parsedData.date || new Date().toISOString().split('T')[0],
      tags: parsedData.tags || ['smart_parsed'],
    });
    setParsedData(null);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Receipt &amp; Expense Parser</h3>
              <p className="text-[10px] text-slate-400">Paste raw receipts, SMS alerts, or natural language notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Receipt text or quick transaction note:
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Examples:\n• "Dinner at Osteria Mozza with teammates for $134.50 on Amex card"\n• "WHOLE FOODS MKT #10243 09/24/2026 TOTAL: $64.88 VISA DEBIT"\n• "Uber ride from airport $42.20 yesterday"`}
            className="w-full bg-slate-800 text-slate-100 text-xs rounded-xl p-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed font-mono"
          />

          <div className="flex justify-between items-center pt-1">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setInputText("Whole Foods Market Organic Groceries $78.45 on credit card")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                Sample 1
              </button>
              <button
                type="button"
                onClick={() => setInputText("Chevron Gasoline 12.4 gallons $52.30 debit card")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                Sample 2
              </button>
            </div>

            <button
              type="button"
              onClick={handleParse}
              disabled={!inputText.trim() || isParsing}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'Analyzing...' : 'Parse with AI'}</span>
            </button>
          </div>
        </div>

        {/* Parsed Result Preview */}
        {parsedData && (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" /> Extracted Transaction
              </span>
              <span className="text-base font-black font-mono text-white">
                {formatCurrency(parsedData.amount, currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                <span className="text-[10px] text-slate-500 uppercase block">Description</span>
                <span className="font-semibold text-slate-200 truncate block">{parsedData.description}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                <span className="text-[10px] text-slate-500 uppercase block">Category</span>
                <span className="font-semibold text-slate-200 truncate block">{parsedData.category}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                <span className="text-[10px] text-slate-500 uppercase block">Date</span>
                <span className="font-mono text-slate-200 block">{parsedData.date}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                <span className="text-[10px] text-slate-500 uppercase block">Payment Method</span>
                <span className="capitalize text-slate-200 block">{parsedData.paymentMethod?.replace('_', ' ')}</span>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Add to Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
