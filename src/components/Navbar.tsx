import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  ReceiptText, 
  PiggyBank, 
  PieChart, 
  CalendarClock, 
  Sparkles, 
  Plus, 
  ScanLine, 
  SlidersHorizontal,
  Wallet,
  Globe,
  FileCheck
} from 'lucide-react';
import { CURRENCIES } from '../data/initialData';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  onOpenCurrencyModal: () => void;
  netSavings: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  onOpenAddModal,
  onOpenScanModal,
  onOpenCurrencyModal,
}) => {
  const currentConfig = CURRENCIES[currency] || CURRENCIES.USD;
  const tabs = [
    { id: 'home', label: 'Home (Gemini)', icon: Home, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'budget', label: 'Budget Plan', icon: SlidersHorizontal },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: PiggyBank },
    { id: 'bills', label: 'Recurring Bills', icon: CalendarClock },
    { id: 'ai-assistant', label: 'AI Advisor', icon: Sparkles },
    { id: 'reports', label: 'Recommendations & PDF', icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl group-hover:scale-105 transition">
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-emerald-300 transition">
                  AISmartBudget
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Intelligent Wealth &amp; Cash Flow Manager</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Country & Currency selector with modal trigger */}
            <div className="flex items-center space-x-1">
              <button
                onClick={onOpenCurrencyModal}
                title={`Change Country & Currency (Current: ${currentConfig.country} - ${currentConfig.name})`}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-emerald-500/40 transition"
              >
                <span className="text-sm leading-none">{currentConfig.flag}</span>
                <span className="font-mono text-xs">{currentConfig.code}</span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">({currentConfig.symbol})</span>
                <Globe className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>
            </div>

            {/* Quick scan receipt button */}
            <button
              onClick={onOpenScanModal}
              title="Quick AI Receipt / Note Parser"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <span>Smart Parser</span>
            </button>

            {/* Add transaction button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation row */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-none py-2 border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-inner border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                } ${tab.highlight && !isActive ? 'text-emerald-400/90 font-semibold' : ''}`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight ? 'text-emerald-400 animate-pulse' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
