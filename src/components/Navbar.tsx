import React from 'react';
import { 
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
  FileSpreadsheet,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { CURRENCIES } from '../data/initialData';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  netSavings: number;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onSyncSheets: () => void;
  isSyncingSheets: boolean;
  spreadsheetUrl: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenAddModal,
  onOpenScanModal,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  onSyncSheets,
  isSyncingSheets,
  spreadsheetUrl,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'budget', label: 'Budget Plan', icon: SlidersHorizontal },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: PiggyBank },
    { id: 'bills', label: 'Recurring Bills', icon: CalendarClock },
    { id: 'ai-assistant', label: 'AI Advisor', icon: Sparkles, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">AISmartBudget</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Intelligent Wealth &amp; Cash Flow Manager</p>
            </div>
          </div>

          {/* Quick Actions & Auth */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Google Sheets Sync / Sign In */}
            {googleUser ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={onSyncSheets}
                  disabled={isSyncingSheets}
                  title="Export budget & transactions to Google Sheets"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition disabled:opacity-50"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingSheets ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">{isSyncingSheets ? 'Exporting...' : 'Sync Sheets'}</span>
                </button>

                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
                    title="Open exported Google Sheet"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="flex items-center space-x-1 pl-1">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google Account'}
                      className="w-7 h-7 rounded-full border border-slate-700"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {googleUser.displayName?.[0] || 'U'}
                    </span>
                  )}
                  <button
                    onClick={onGoogleSignOut}
                    title="Sign Out from Google"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">Google Workspace</span>
              </button>
            )}

            {/* Currency selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c}>
                  {c} ({CURRENCIES[c].symbol})
                </option>
              ))}
            </select>

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
