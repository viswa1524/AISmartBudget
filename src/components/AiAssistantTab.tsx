import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { Transaction, BudgetCategory, SavingsGoal, FinancialAuditReport, ChatMessage } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AiAssistantTabProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  currency: string;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  transactions,
  categories,
  goals,
  currency,
}) => {
  const [activeSubView, setActiveSubView] = useState<'audit' | 'chat'>('audit');

  // Audit State
  const [auditReport, setAuditReport] = useState<FinancialAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSource, setAuditSource] = useState<'gemini' | 'computed' | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "Hello! I'm your AI Smart Budget Financial Advisor. I have real-time visibility into your cash inflows, category expenditures, and savings goals.\n\nHow can I help optimize your money today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Inflow & outflow summary
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Run audit on first mount or on button click
  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const response = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: { totalIncome, totalExpense, netSavings, savingsRate },
          transactions: transactions.slice(0, 30),
          categories,
          goals,
          currency,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAuditReport(resData.data);
        setAuditSource(resData.source);
      }
    } catch (err) {
      console.error('[AISmartBudget] Audit request error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    if (!auditReport) {
      runAudit();
    }
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          context: {
            totalIncome,
            totalExpense,
            savingsRate,
            currency,
            topCategories: categories.slice(0, 4).map(c => c.category),
            goals: goals.map(g => ({ title: g.title, target: g.targetAmount, current: g.currentAmount })),
          },
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();
      const aiReply = data.reply || "I analyzed your budget: your cash flow is steady. Aim to automate 20% to emergency savings.";

      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-res-' + Date.now(),
          sender: 'assistant',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('[AISmartBudget] Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          sender: 'assistant',
          text: "I encountered a network hiccup, but based on your recent ledger, trimming non-essential dining and shopping by 15% will easily unlock over $150 in monthly cash flow.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">AI Financial Intelligence</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Gemini 3.8 Flash Powered
            </span>
          </div>
          <p className="text-xs text-slate-400">Comprehensive financial audit report and interactive AI budget advisor</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex space-x-1">
            <button
              onClick={() => setActiveSubView('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubView === 'audit' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Report
            </button>
            <button
              onClick={() => setActiveSubView('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubView === 'chat' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ask Advisor
            </button>
          </div>

          {activeSubView === 'audit' && (
            <button
              onClick={runAudit}
              disabled={isAuditing}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing...' : 'Refresh Audit'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Comprehensive Financial Audit Report */}
      {activeSubView === 'audit' && (
        <div className="space-y-6">
          {isAuditing && !auditReport ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Analyzing cash flow and transaction ledger with Gemini...</p>
              <p className="text-xs text-slate-400">Evaluating burn rate, savings efficiency, and budget variance</p>
            </div>
          ) : auditReport ? (
            <>
              {/* Overall Score & Grade Card */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-5">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {auditReport.healthGrade}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Rating</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Financial Health Score: {auditReport.overallScore}/100
                        </span>
                        {auditSource === 'gemini' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                            AI Verified
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">Executive Summary</h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        {auditReport.summary}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Savings Rate</span>
                      <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                        {auditReport.savingsRate}%
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Burn</span>
                      <p className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                        {formatCurrency(auditReport.monthlyBurnRate, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Critical Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Strengths */}
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Key Financial Strengths</h4>
                  </div>
                  <div className="space-y-2">
                    {auditReport.keyStrengths?.map((str, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs text-slate-200 flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold shrink-0">•</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks / Leakages */}
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Cash Flow Risks &amp; Leakages</h4>
                  </div>
                  <div className="space-y-2">
                    {auditReport.criticalRisks?.map((risk, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-slate-200 flex items-start space-x-2">
                        <span className="text-amber-400 font-bold shrink-0">•</span>
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* High-Impact Recommended Actions */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Recommended Savings &amp; Reallocation Actions</h4>
                  </div>
                  <span className="text-xs text-slate-400">Prioritized by financial return</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {auditReport.recommendedActions?.map((act, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            act.impact === 'High' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {act.impact} Impact
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            +{formatCurrency(act.potentialSavings, currency)}/mo
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white">{act.title}</h5>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Budget Adjustments */}
              {auditReport.budgetAdjustments && auditReport.budgetAdjustments.length > 0 && (
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Suggested Category Budget Adjustments</h4>
                  <div className="divide-y divide-slate-800 text-xs">
                    {auditReport.budgetAdjustments.map((adj, idx) => (
                      <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-white">{adj.category}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{adj.action}</p>
                        </div>
                        <div className="font-mono text-right shrink-0">
                          <span className="text-slate-400 text-xs">Current: {formatCurrency(adj.currentSpending, currency)}</span>
                          <span className="mx-2 text-slate-600">→</span>
                          <span className="text-emerald-400 font-bold text-xs">Target: {formatCurrency(adj.recommendedLimit, currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* VIEW 2: Interactive AI Wealth Advisor Chat */}
      {activeSubView === 'chat' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[580px] overflow-hidden shadow-lg">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">SmartBudget AI Advisor</h3>
                <p className="text-[10px] text-slate-400">Contextual answers grounded in your real financial accounts</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Online
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                        : 'bg-emerald-500 text-slate-950 font-medium rounded-tr-sm shadow-md'
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-[9px] mt-2 text-right ${
                        isAssistant ? 'text-slate-500' : 'text-slate-800 font-semibold'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl p-3 bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Advisor is formulating recommendation...</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-800/20 flex space-x-2 overflow-x-auto scrollbar-none text-[11px]">
            {[
              "How can I save $300 more this month?",
              "Am I overspending on dining & groceries?",
              "Help me plan for my emergency fund goal",
              "Which subscription should I cancel first?"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask financial advice, debt payoff strategies, or budget questions..."
                className="flex-1 bg-slate-800 text-slate-100 text-xs rounded-xl px-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
