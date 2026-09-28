import React, { useState } from 'react';
import { X, Search, Globe, Check, ArrowRight } from 'lucide-react';
import { CURRENCIES } from '../data/initialData';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelectCurrency: (code: string) => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  selectedCurrency,
  onSelectCurrency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currencyList = Object.values(CURRENCIES).filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.country.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.symbol.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Select Country &amp; Currency</h3>
              <p className="text-xs text-slate-400">Choose your regional currency for instant recalculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by country, currency name, or ISO code (e.g. India, Yen, EUR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-3.5 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            autoFocus
          />
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[300px]">
          {currencyList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching country or currency found for "{searchTerm}".
            </div>
          ) : (
            currencyList.map((curr) => {
              const isSelected = selectedCurrency === curr.code;
              return (
                <button
                  key={curr.code}
                  onClick={() => {
                    onSelectCurrency(curr.code);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition border ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                      : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-2xl shrink-0 leading-none">{curr.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white truncate">{curr.country}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-400 border border-slate-700">
                          {curr.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {curr.name} • Symbol: <strong className="text-slate-300">{curr.symbol}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right text-[11px] font-mono">
                      <span className="text-slate-400 block text-[10px]">Exchange Rate</span>
                      <span className="font-semibold text-slate-200">
                        {curr.rate === 1 ? '1.00 USD' : `${curr.rate} / USD`}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
