import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Printer, 
  FileSpreadsheet, 
  HardDrive, 
  ExternalLink, 
  RefreshCw, 
  FileCheck, 
  BadgePercent, 
  ArrowUpRight, 
  Wallet,
  Calendar,
  Layers,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Filter,
  Search,
  Table,
  SlidersHorizontal,
  ChevronDown,
  PiggyBank,
  Target,
  MessageSquare,
  BookOpen,
  Send,
  Server,
  Database,
  Cpu,
  Code2,
  Terminal,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Transaction, BudgetCategory, SavingsGoal, RecurringBill, FinancialAuditReport } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BackendHealthResponse } from '../services/api';

interface ReportsAndExportTabProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  recurringBills: RecurringBill[];
  currency: string;
  backendHealth?: BackendHealthResponse | null;
}

export const ReportsAndExportTab: React.FC<ReportsAndExportTabProps> = ({
  transactions,
  categories,
  goals,
  recurringBills,
  currency,
  backendHealth
}) => {
  const [report, setReport] = useState<FinancialAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingSummaryPdf, setExportingSummaryPdf] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedSimpleDraft, setCopiedSimpleDraft] = useState(false);
  const [showBackendGuide, setShowBackendGuide] = useState(false);

  // Wording Style Toggle: 'simple' (Plain Everyday Words) vs 'formal' (Detailed)
  const [wordingStyle, setWordingStyle] = useState<'simple' | 'formal'>('simple');

  // CSV Configuration state
  const [csvDateRange, setCsvDateRange] = useState<'all' | '30days' | 'month' | '90days' | 'year'>('all');
  const [csvType, setCsvType] = useState<'all' | 'expense' | 'income'>('all');
  const [csvCategory, setCsvCategory] = useState<string>('all');
  const [csvSearch, setCsvSearch] = useState<string>('');
  const [csvIncludeSummary, setCsvIncludeSummary] = useState<boolean>(true);
  const [csvIncludeHeaders, setCsvIncludeHeaders] = useState<boolean>(true);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  const [exportedCsvCount, setExportedCsvCount] = useState<number | null>(null);

  // Compute live calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Savings goals calculations
  const totalTargetGoals = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavedGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallGoalsProgress = totalTargetGoals > 0 ? Math.round((totalSavedGoals / totalTargetGoals) * 100) : 0;

  // Category spending breakdown
  const categorySpending = categories.map(cat => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === cat.category.toLowerCase())
      .reduce((acc, t) => acc + t.amount, 0);
    const percent = cat.monthlyLimit > 0 ? Math.round((spent / cat.monthlyLimit) * 100) : 0;
    return {
      category: cat.category,
      limit: cat.monthlyLimit,
      spent,
      percent,
      isOver: spent > cat.monthlyLimit
    };
  }).sort((a, b) => b.spent - a.spent);

  // Filtered transactions for CSV Export
  const filteredForCsv = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (csvType !== 'all' && t.type !== csvType) return false;
      // Category filter
      if (csvCategory !== 'all' && t.category.toLowerCase() !== csvCategory.toLowerCase()) return false;
      // Search filter
      if (csvSearch.trim()) {
        const q = csvSearch.toLowerCase().trim();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
        if (!matchDesc && !matchCat && !matchNotes && !matchTags) return false;
      }
      // Date range filter
      if (csvDateRange !== 'all') {
        const txDate = new Date(t.date);
        const now = new Date();
        if (csvDateRange === 'month') {
          const isThisMonth = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        } else if (csvDateRange === '30days') {
          const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30 || diffDays < 0) return false;
        } else if (csvDateRange === '90days') {
          const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 90 || diffDays < 0) return false;
        } else if (csvDateRange === 'year') {
          if (txDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [transactions, csvType, csvCategory, csvSearch, csvDateRange]);

  // CSV Stats
  const csvStats = useMemo(() => {
    const income = filteredForCsv.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredForCsv.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    return { count: filteredForCsv.length, income, expense, net };
  }, [filteredForCsv]);

  // Fetch or generate AI recommendations (Drafted in simple words)
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: { totalIncome, totalExpense },
          transactions,
          categories,
          goals,
          currency,
          simpleWords: true
        })
      });
      const data = await res.json();
      if (data.report || data.data) {
        setReport(data.report || data.data);
      }
    } catch (err) {
      console.error('Failed to generate audit report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Simple Plain-English Draft generator for Client Notes
  const simpleClientDraft = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const score = report?.overallScore || (savingsRate > 20 ? 85 : 70);
    const grade = report?.healthGrade || (score > 80 ? 'A' : 'B');

    const topSpend = categorySpending.slice(0, 3).map(c => 
      `• ${c.category}: ${currency}${c.spent.toLocaleString()} spent (${c.isOver ? 'over budget' : 'on track'})`
    ).join('\n');

    const goalsSummary = goals.length > 0
      ? goals.map(g => `• ${g.title}: ${currency}${g.currentAmount.toLocaleString()} saved of ${currency}${g.targetAmount.toLocaleString()} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`).join('\n')
      : '• No active savings goals set up yet.';

    const actions = (report?.recommendedActions || [
      { title: 'Cook at home a bit more often', description: 'Eating out less frees up cash quickly.' },
      { title: 'Cancel unused subscriptions', description: 'Check recurring monthly apps or streaming.' },
      { title: 'Save before spending', description: 'Move savings into a separate jar on payday.' }
    ]).slice(0, 3).map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join('\n');

    return `Hi! Here is your quick money checkup in simple words (${today}):

1. THE BIG PICTURE (MONEY FLOW)
• Money In (Income): ${currency}${totalIncome.toLocaleString()}
• Money Out (Spent): ${currency}${totalExpense.toLocaleString()}
• Money Left Over: ${currency}${netSavings.toLocaleString()} (${savingsRate}% saved)
• Money Health Score: ${score}/100 (Grade ${grade})

2. WHERE YOUR MONEY WENT (TOP CATEGORIES)
${topSpend}

3. GOALS YOU ARE SAVING FOR
${goalsSummary}

4. SIMPLE TIPS TO SAVE MORE
${actions}

Summary: ${report?.summary || `You have ${currency}${Math.max(0, netSavings).toLocaleString()} left over after bills. Keep going!`}
`;
  }, [totalIncome, totalExpense, netSavings, savingsRate, report, currency, categorySpending, goals]);

  // Copy or Download Simple Client Draft
  const handleCopySimpleDraft = () => {
    navigator.clipboard.writeText(simpleClientDraft);
    setCopiedSimpleDraft(true);
    setTimeout(() => setCopiedSimpleDraft(false), 2000);
  };

  const handleDownloadSimpleDraft = () => {
    const blob = new Blob([simpleClientDraft], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Simple-Money-Summary-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate CSV String from filtered transactions
  const generateCSVContent = (items: Transaction[] = filteredForCsv): string => {
    const lines: string[] = [];

    if (csvIncludeHeaders) {
      lines.push('Transaction ID,Date,Type,Description,Category,Amount,Currency,Payment Method,Tags,Notes');
    }

    items.forEach(t => {
      const cleanId = `"${t.id || ''}"`;
      const cleanDate = `"${t.date}"`;
      const cleanType = `"${t.type}"`;
      const cleanDesc = `"${t.description.replace(/"/g, '""')}"`;
      const cleanCategory = `"${t.category.replace(/"/g, '""')}"`;
      const amountVal = t.amount.toFixed(2);
      const curr = `"${currency}"`;
      const cleanPayment = `"${t.paymentMethod || 'other'}"`;
      const cleanTags = `"${(t.tags || []).join('; ').replace(/"/g, '""')}"`;
      const cleanNotes = `"${(t.notes || '').replace(/"/g, '""')}"`;

      lines.push(`${cleanId},${cleanDate},${cleanType},${cleanDesc},${cleanCategory},${amountVal},${curr},${cleanPayment},${cleanTags},${cleanNotes}`);
    });

    if (csvIncludeSummary) {
      lines.push('');
      lines.push('--- SUMMARY IN SIMPLE WORDS ---,,,,,,,,,');
      lines.push(`Total Transactions,${items.length},,,,,,,,`);
      lines.push(`Money In (Total Inflow),${csvStats.income.toFixed(2)},${currency},,,,,,,`);
      lines.push(`Money Out (Total Outflow),${csvStats.expense.toFixed(2)},${currency},,,,,,,`);
      lines.push(`Money Left Over (Net),${csvStats.net.toFixed(2)},${currency},,,,,,,`);
      lines.push(`Exported On,"${new Date().toISOString()}",,,,,,,,`);
    }

    return lines.join('\n');
  };

  // Download CSV Handler
  const handleExportCSV = (allItems: boolean = false) => {
    const listToExport = allItems ? transactions : filteredForCsv;
    const csvData = generateCSVContent(listToExport);

    const blob = new Blob(['\ufeff', csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const dateStr = new Date().toISOString().split('T')[0];
    const suffix = allItems ? 'All' : `${csvDateRange}-${csvType}`;
    link.download = `AISmartBudget-Transactions-${suffix}-${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExportedCsvCount(listToExport.length);
    setTimeout(() => setExportedCsvCount(null), 3000);
  };

  // Copy CSV to Clipboard
  const handleCopyCSV = () => {
    const csvData = generateCSVContent(filteredForCsv);
    navigator.clipboard.writeText(csvData);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // Dedicated PDF Summary Generator in Simple Words: Income, Expenses & Goals
  const generateSummaryPDF = () => {
    setExportingSummaryPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Header Banner (Navy Slate)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, 'F');

      // Brand Logo & Simple Title
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AISmartBudget', 14, 15);

      doc.setTextColor(241, 245, 249);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Your Simple Money & Savings Summary', 14, 22);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8.5);
      doc.text(`Drafted in simple words for you • Date: ${today} • Base Currency: ${currency}`, 14, 29);

      // Section 1: 4 Simple Metric Boxes
      let yPos = 44;
      const boxWidth = 43;
      const boxHeight = 22;
      const startX = 14;
      const gap = 3.5;

      // 1. Money In Box
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(startX, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('MONEY IN (INCOME)', startX + 4, yPos + 6);
      doc.setFontSize(11);
      doc.text(`${currency}${totalIncome.toLocaleString()}`, startX + 4, yPos + 15);

      // 2. Money Out Box
      const box2X = startX + boxWidth + gap;
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(box2X, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(225, 29, 72);
      doc.text('MONEY OUT (SPENT)', box2X + 4, yPos + 6);
      doc.setFontSize(11);
      doc.text(`${currency}${totalExpense.toLocaleString()}`, box2X + 4, yPos + 15);

      // 3. Money Left Over Box
      const box3X = box2X + boxWidth + gap;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(box3X, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('MONEY LEFT OVER', box3X + 4, yPos + 6);
      doc.setFontSize(10.5);
      doc.setTextColor(netSavings >= 0 ? 16 : 225, netSavings >= 0 ? 185 : 29, netSavings >= 0 ? 129 : 72);
      doc.text(`${currency}${netSavings.toLocaleString()} (${savingsRate}%)`, box3X + 4, yPos + 15);

      // 4. Goals Saved Box
      const box4X = box3X + boxWidth + gap;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(box4X, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235);
      doc.text('GOALS SAVED', box4X + 4, yPos + 6);
      doc.setFontSize(10.5);
      doc.text(`${currency}${totalSavedGoals.toLocaleString()} (${overallGoalsProgress}%)`, box4X + 4, yPos + 15);

      yPos += 30;

      // Section 2: Goals You Are Saving For (Simple Words Table)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Goals You Are Saving For (Simple Breakdown)', 14, yPos);
      yPos += 5;

      doc.setFillColor(30, 41, 59);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Goal Name', 18, yPos + 4.8);
      doc.text('Target Goal', 68, yPos + 4.8);
      doc.text('Saved So Far', 96, yPos + 4.8);
      doc.text('Still Needed', 126, yPos + 4.8);
      doc.text('Done %', 156, yPos + 4.8);
      doc.text('Target Date', 178, yPos + 4.8);
      yPos += 7.5;

      if (goals.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('No active savings goals recorded yet.', 18, yPos + 5);
        yPos += 10;
      } else {
        goals.forEach((goal, idx) => {
          const isAlt = idx % 2 === 1;
          if (isAlt) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, yPos, 182, 7.5, 'F');
          }

          const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(goal.title.substring(0, 24), 18, yPos + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(`${currency}${goal.targetAmount.toLocaleString()}`, 68, yPos + 5);

          doc.setTextColor(16, 185, 129);
          doc.setFont('helvetica', 'bold');
          doc.text(`${currency}${goal.currentAmount.toLocaleString()}`, 96, yPos + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`${currency}${remaining.toLocaleString()}`, 126, yPos + 5);

          doc.setTextColor(pct >= 100 ? 16 : 37, pct >= 100 ? 185 : 99, pct >= 100 ? 129 : 235);
          doc.setFont('helvetica', 'bold');
          doc.text(`${pct}%`, 156, yPos + 5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(goal.deadline || 'Ongoing', 178, yPos + 5);

          doc.setDrawColor(226, 232, 240);
          doc.line(14, yPos + 7.5, 196, yPos + 7.5);
          yPos += 7.5;
        });
      }

      // Summary bar for goals
      yPos += 1.5;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL SAVINGS ACROSS ALL GOALS', 18, yPos + 4.8);
      doc.text(`${currency}${totalTargetGoals.toLocaleString()}`, 68, yPos + 4.8);
      doc.setTextColor(16, 185, 129);
      doc.text(`${currency}${totalSavedGoals.toLocaleString()}`, 96, yPos + 4.8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${currency}${Math.max(0, totalTargetGoals - totalSavedGoals).toLocaleString()}`, 126, yPos + 4.8);
      doc.setTextColor(37, 99, 235);
      doc.text(`${overallGoalsProgress}% Funded`, 156, yPos + 4.8);
      yPos += 13;

      // Section 3: Where Your Money Went
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Where Your Money Went (Categories in Simple Words)', 14, yPos);
      yPos += 5;

      doc.setFillColor(30, 41, 59);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Category', 18, yPos + 4.8);
      doc.text('Monthly Plan', 75, yPos + 4.8);
      doc.text('What You Spent', 120, yPos + 4.8);
      doc.text('Status', 160, yPos + 4.8);
      yPos += 7.5;

      categorySpending.slice(0, 6).forEach((cat, idx) => {
        const isAlt = idx % 2 === 1;
        if (isAlt) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, yPos, 182, 7.5, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(cat.category, 18, yPos + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${currency}${cat.limit.toLocaleString()}`, 75, yPos + 5);
        doc.text(`${currency}${cat.spent.toLocaleString()}`, 120, yPos + 5);

        if (cat.isOver) {
          doc.setTextColor(225, 29, 72);
          doc.setFont('helvetica', 'bold');
          doc.text(`Over by ${cat.percent}%`, 160, yPos + 5);
        } else {
          doc.setTextColor(16, 185, 129);
          doc.setFont('helvetica', 'bold');
          doc.text(`Under budget (${cat.percent}%)`, 160, yPos + 5);
        }

        doc.setDrawColor(226, 232, 240);
        doc.line(14, yPos + 7.5, 196, yPos + 7.5);
        yPos += 7.5;
      });

      yPos += 6;

      // Section 4: Simple Money Takeaway Box (Everyday words)
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(14, yPos, 182, 26, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(6, 95, 70);
      doc.text('Simple Summary & What To Do Next:', 18, yPos + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      const line1 = `• You brought in ${currency}${totalIncome.toLocaleString()} and spent ${currency}${totalExpense.toLocaleString()}. You kept ${currency}${netSavings.toLocaleString()} in savings (${savingsRate}% saved).`;
      const line2 = `• For your goals, you have already saved ${currency}${totalSavedGoals.toLocaleString()} out of ${currency}${totalTargetGoals.toLocaleString()} needed (${overallGoalsProgress}% done).`;
      const line3 = netSavings > 0
        ? `• Good job! With ${currency}${netSavings.toLocaleString()} left over this month, you can finish your savings goals ahead of time.`
        : `• Tip: You spent ${currency}${Math.abs(netSavings).toLocaleString()} more than you made this month. Try trimming dining or shopping next week.`;

      doc.text(line1, 18, yPos + 11.5);
      doc.text(line2, 18, yPos + 16.5);
      doc.text(line3, 18, yPos + 21.5);

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Simple Summary • Created with AISmartBudget', 14, 287);
      doc.text(`Page 1 of 1 • ${today}`, 165, 287);

      doc.save(`AISmartBudget-Simple-Summary-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating Summary PDF:', err);
    } finally {
      setExportingSummaryPdf(false);
    }
  };

  // Full Multi-Page Audit PDF in Simple Words
  const generatePDF = () => {
    setExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(52, 211, 153);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('AISmartBudget', 14, 18);

      doc.setTextColor(241, 245, 249);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Simple Money Audit & Recommendations', 14, 26);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text(`Date: ${today} | Base Currency: ${currency} | Drafted in Plain English`, 14, 32);

      // Top KPIs Summary Bar
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 44, 182, 22, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 44, 182, 22, 'S');

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('MONEY IN', 20, 51);
      doc.text('MONEY OUT', 65, 51);
      doc.text('MONEY LEFT OVER', 115, 51);
      doc.text('YOUR MONEY SCORE', 158, 51);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text(`${currency}${totalIncome.toLocaleString()}`, 20, 60);

      doc.setTextColor(225, 29, 72);
      doc.text(`${currency}${totalExpense.toLocaleString()}`, 65, 60);

      doc.setTextColor(totalIncome >= totalExpense ? 16 : 225, totalIncome >= totalExpense ? 185 : 29, totalIncome >= totalExpense ? 129 : 72);
      doc.text(`${currency}${netSavings.toLocaleString()} (${savingsRate}%)`, 115, 60);

      doc.setTextColor(15, 23, 42);
      const score = report?.overallScore || (savingsRate > 20 ? 85 : 70);
      const grade = report?.healthGrade || (score > 80 ? 'A' : 'B');
      doc.text(`${score}/100 (${grade})`, 160, 60);

      let yPos = 76;

      // Executive Summary in Plain Words
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('1. The Big Picture (In Simple Words)', 14, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const summaryText = report?.summary || 
        `Here is the simple story of your money: You made ${currency}${totalIncome.toLocaleString()} and spent ${currency}${totalExpense.toLocaleString()}. You saved ${currency}${netSavings.toLocaleString()}, which means you kept ${savingsRate} cents of every dollar you earned.`;
      
      const splitSummary = doc.splitTextToSize(summaryText, 182);
      doc.text(splitSummary, 14, yPos);
      yPos += splitSummary.length * 5 + 6;

      // Simple Recommendations Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Simple Tips to Save More Money', 14, yPos);
      yPos += 6;

      const actions = report?.recommendedActions || [
        {
          title: 'Cook at Home a Few More Days Each Week',
          impact: 'High',
          description: 'Eating out or getting delivery is usually your fastest cash leak. Cutting back by 2 meals a week keeps good money in your pocket.',
          potentialSavings: Math.round(totalExpense * 0.08)
        },
        {
          title: 'Build a 3-Month Rainy Day Cushion',
          impact: 'Medium',
          description: 'Set up an automatic transfer on payday so your emergency fund builds up without you having to think about it.',
          potentialSavings: Math.round(totalIncome * 0.1)
        },
        {
          title: 'Cancel 1 or 2 Unused Subscriptions',
          impact: 'Medium',
          description: 'Look through streaming apps and gym memberships you rarely use. Cancelling them is instant free savings.',
          potentialSavings: Math.round(totalExpense * 0.04)
        }
      ];

      actions.slice(0, 4).forEach((act, idx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.rect(14, yPos - 2, 182, 16, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, yPos - 2, 182, 16, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${act.title}`, 18, yPos + 3);

        doc.setFontSize(8.5);
        doc.setTextColor(16, 185, 129);
        doc.text(`Save: +${currency}${act.potentialSavings}/mo [${act.impact} Impact]`, 140, yPos + 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(act.description, 174);
        doc.text(descLines, 18, yPos + 9);

        yPos += 19;
      });

      yPos += 4;

      // Category Spending Breakdown Table
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Where Your Money Went (Categories)', 14, yPos);
      yPos += 6;

      doc.setFillColor(226, 232, 240);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Category', 18, yPos + 4.5);
      doc.text('Monthly Plan', 75, yPos + 4.5);
      doc.text('What You Spent', 120, yPos + 4.5);
      doc.text('Status', 158, yPos + 4.5);
      yPos += 8;

      categorySpending.slice(0, 6).forEach(cat => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(cat.category, 18, yPos + 4);
        doc.text(`${currency}${cat.limit.toLocaleString()}`, 75, yPos + 4);
        doc.text(`${currency}${cat.spent.toLocaleString()}`, 120, yPos + 4);

        if (cat.isOver) {
          doc.setTextColor(225, 29, 72);
          doc.text(`Over budget (${cat.percent}%)`, 158, yPos + 4);
        } else {
          doc.setTextColor(16, 185, 129);
          doc.text(`On Track (${cat.percent}%)`, 158, yPos + 4);
        }

        doc.setDrawColor(241, 245, 249);
        doc.line(14, yPos + 6, 196, yPos + 6);
        yPos += 7;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Client Money Summary • Drafted in Plain Words by AISmartBudget', 14, 287);
      doc.text('Page 1 of 1', 182, 287);

      doc.save(`AISmartBudget-Report-Simple-Words-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // Google Drive Compatible Word Document (.doc) in Simple Words
  const downloadDriveDocument = () => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>AISmartBudget - Simple Money Summary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
          h1 { color: #059669; font-size: 24px; border-bottom: 2px solid #059669; padding-bottom: 8px; }
          h2 { color: #0f172a; font-size: 18px; margin-top: 24px; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .kpi-table td { padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; text-align: center; }
          .kpi-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .kpi-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
          .green { color: #059669; }
          .red { color: #e11d48; }
          .rec-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 12px; }
          table.data { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table.data th, table.data td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          table.data th { background: #e2e8f0; }
        </style>
      </head>
      <body>
        <h1>AISmartBudget - Simple Money Summary</h1>
        <p><strong>Date:</strong> ${today} | <strong>Base Currency:</strong> ${currency} | <em>Drafted in Plain Everyday Words</em></p>
        
        <table class="kpi-table">
          <tr>
            <td>
              <div class="kpi-title">Money In (Income)</div>
              <div class="kpi-val green">${currency}${totalIncome.toLocaleString()}</div>
            </td>
            <td>
              <div class="kpi-title">Money Out (Spent)</div>
              <div class="kpi-val red">${currency}${totalExpense.toLocaleString()}</div>
            </td>
            <td>
              <div class="kpi-title">Money Left Over</div>
              <div class="kpi-val green">${currency}${netSavings.toLocaleString()} (${savingsRate}%)</div>
            </td>
            <td>
              <div class="kpi-title">Money Health Score</div>
              <div class="kpi-val">${report?.overallScore || 85}/100 (${report?.healthGrade || 'A'})</div>
            </td>
          </tr>
        </table>

        <h2>1. The Big Picture (In Simple Words)</h2>
        <p>${report?.summary || `You brought in ${currency}${totalIncome.toLocaleString()} and spent ${currency}${totalExpense.toLocaleString()}, which leaves ${currency}${netSavings.toLocaleString()} in your pocket (${savingsRate}% saved).`}</p>

        <h2>2. Simple Steps to Save More Money</h2>
        ${(report?.recommendedActions || []).map((act, i) => `
          <div class="rec-box">
            <strong>${i + 1}. ${act.title}</strong> [${act.impact} Impact] - <em>Save: +${currency}${act.potentialSavings}/month</em>
            <p>${act.description}</p>
          </div>
        `).join('')}

        <h2>3. Goals You Are Saving For</h2>
        <table class="data">
          <thead>
            <tr>
              <th>Goal Name</th>
              <th>Target Goal</th>
              <th>Saved So Far</th>
              <th>Progress</th>
              <th>Target Date</th>
            </tr>
          </thead>
          <tbody>
            ${goals.map(g => `
              <tr>
                <td>${g.title}</td>
                <td>${currency}${g.targetAmount.toLocaleString()}</td>
                <td>${currency}${g.currentAmount.toLocaleString()}</td>
                <td>${Math.round((g.currentAmount / g.targetAmount) * 100)}%</td>
                <td>${g.deadline}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>4. Where Your Money Went</h2>
        <table class="data">
          <thead>
            <tr>
              <th>Category</th>
              <th>Monthly Plan</th>
              <th>What You Spent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${categorySpending.map(c => `
              <tr>
                <td>${c.category}</td>
                <td>${currency}${c.limit.toLocaleString()}</td>
                <td>${currency}${c.spent.toLocaleString()}</td>
                <td style="color: ${c.isOver ? '#e11d48' : '#059669'}; font-weight: bold;">
                  ${c.isOver ? 'Over budget' : 'On Track'} (${c.percent}%)
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px;">
          Drafted in simple, friendly words by AISmartBudget • Opens right in Google Drive &amp; Google Docs
        </p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AISmartBudget-Simple-Summary-${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Markdown Export in Simple Words
  const copyOrDownloadMarkdown = (download = false) => {
    const md = `# AISmartBudget Simple Money Summary
**Date:** ${new Date().toLocaleDateString()} | **Currency:** ${currency}

## 1. The Big Picture
- **Money In (Income):** ${currency}${totalIncome.toLocaleString()}
- **Money Out (Spent):** ${currency}${totalExpense.toLocaleString()}
- **Money Left Over:** ${currency}${netSavings.toLocaleString()} (${savingsRate}% saved)
- **Money Health Score:** ${report?.overallScore || 85}/100 (Grade ${report?.healthGrade || 'A'})

## 2. In Plain Words
${report?.summary || 'You made steady income and kept positive cash left over after paying all bills.'}

## 3. Simple Tips to Save More Money
${(report?.recommendedActions || []).map((a, i) => `${i + 1}. **${a.title}** (${a.impact} Impact | Save: +${currency}${a.potentialSavings}/mo)\n   - ${a.description}`).join('\n\n')}

## 4. Goals You Are Saving For
${goals.map(g => `- **${g.title}:** ${currency}${g.currentAmount.toLocaleString()} of ${currency}${g.targetAmount.toLocaleString()} (${Math.round((g.currentAmount / g.targetAmount) * 100)}% done)`).join('\n')}

---
*Drafted in simple words by AISmartBudget*
`;

    if (download) {
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Simple-Money-Summary-${new Date().toISOString().split('T')[0]}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToCsvSection = () => {
    const el = document.getElementById('csv-export-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {wordingStyle === 'simple' ? 'Simple Money Summary & Exports' : 'Recommendations & File Export Suite'}
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Simple Words Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {wordingStyle === 'simple'
                ? 'Your complete money checkup drafted in plain, everyday English. Convert details into a clean PDF summary, client draft, Google Drive doc, or CSV spreadsheet.'
                : 'Get certified AI financial recommendations and convert your complete transaction history and financial details into downloadable CSV spreadsheets, PDF reports, or Google Drive documents.'}
            </p>
          </div>

          {/* Style Toggle & Actions */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Wording Style Selector */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setWordingStyle('simple')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                  wordingStyle === 'simple'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Draft everything in easy, friendly everyday words"
              >
                <Lightbulb className="w-3 h-3" />
                <span>Simple Words</span>
              </button>
              <button
                onClick={() => setWordingStyle('formal')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  wordingStyle === 'formal'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Standard financial terminology"
              >
                <span>Detailed</span>
              </button>
            </div>

            {/* Backend Connection Indicator & Modal Trigger */}
            <button
              onClick={() => setShowBackendGuide(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 hover:border-emerald-500/40 transition"
              title="Click to view backend connection guide and live status"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backend: {backendHealth?.status === 'ok' ? 'Express :3000' : 'Offline'}</span>
              <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            {/* Generate & Download PDF Summary */}
            <button
              onClick={generateSummaryPDF}
              disabled={exportingSummaryPdf}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              title="Download simple PDF summary of money in, money out, and savings goals"
            >
              <PiggyBank className="w-3.5 h-3.5 text-slate-950" />
              <span>{exportingSummaryPdf ? 'Generating...' : 'Download Summary PDF'}</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition shadow-sm"
              title="Download all transaction history as a CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportedCsvCount ? `Exported ${exportedCsvCount} CSV!` : 'Export CSV'}</span>
            </button>

            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
              title="Refresh recommendations with fresh calculations"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Thinking...' : 'Refresh Tips'}</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Banner (In Simple Words) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {wordingStyle === 'simple' ? 'Money In (Income)' : 'Total Income'}
            </span>
            <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
              {formatCurrency(totalIncome, currency)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {wordingStyle === 'simple' ? 'Money Out (Spent)' : 'Total Expenses'}
            </span>
            <p className="text-base sm:text-lg font-bold text-rose-400 mt-0.5">
              {formatCurrency(totalExpense, currency)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {wordingStyle === 'simple' ? 'Money Left Over (Saved)' : 'Net Savings'}
            </span>
            <p className={`text-base sm:text-lg font-bold mt-0.5 ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netSavings, currency)} <span className="text-xs font-normal text-slate-400">({savingsRate}%)</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {wordingStyle === 'simple' ? 'Your Money Score' : 'Financial Health'}
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-black text-amber-300">
                {report?.overallScore || 85}/100
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Grade {report?.healthGrade || 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DRAFT FOR CLIENT IN SIMPLE WORDS (Instant Copy/Send Box) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Client Summary Draft (In Plain Everyday Words)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ready to Send
              </span>
            </div>
            <p className="text-xs text-slate-400">
              A clean, jargon-free summary written so any client, family member, or friend can understand immediately.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySimpleDraft}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
              title="Copy plain-words draft to clipboard"
            >
              {copiedSimpleDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSimpleDraft ? 'Copied to Clipboard!' : 'Copy Simple Draft'}</span>
            </button>

            <button
              onClick={handleDownloadSimpleDraft}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Download draft as a simple text file"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Save .txt</span>
            </button>
          </div>
        </div>

        {/* Live Draft Preview Box */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto select-all">
          {simpleClientDraft}
        </div>
      </div>

      {/* EXPORT CONVERSION SUITE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              {wordingStyle === 'simple' ? 'Download & Share Your Details' : 'Convert & Export Financial Details'}
            </h2>
          </div>
          <span className="text-xs text-slate-400">Choose your preferred download format</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Format 1: Targeted Income, Expenses & Goals Summary PDF */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 p-4 flex flex-col justify-between hover:border-emerald-500/50 transition shadow-lg group relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Simple Summary PDF</h3>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Plain Words
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                A 1-page summary in simple words showing your income, expenses, what is left over, and savings goals.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-800/80">
              <button
                onClick={generateSummaryPDF}
                disabled={exportingSummaryPdf}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingSummaryPdf ? 'Generating...' : 'Download Summary PDF'}</span>
              </button>
            </div>
          </div>

          {/* Format 2: Full Audit PDF */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition shadow-lg group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Complete PDF Report</h3>
              <p className="text-xs text-slate-400 mt-1">
                Detailed report with health scores, budget category tables, and practical money saving tips.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center space-x-2">
              <button
                onClick={generatePDF}
                disabled={exportingPdf}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Print or Save via Browser"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Format 3: Google Drive File */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition shadow-lg group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Google Drive Doc</h3>
              <p className="text-xs text-slate-400 mt-1">
                Editable document (.doc) in simple words ready to upload straight into Google Docs.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center space-x-2">
              <button
                onClick={downloadDriveDocument}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save for Drive</span>
              </button>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition inline-flex items-center justify-center"
                title="Open Google Drive Web"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              </a>
            </div>
          </div>

          {/* Format 4: Transaction CSV Exporter */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition shadow-lg group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Spreadsheet (CSV)</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                  {transactions.length} rows
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Full list of your transactions formatted for Excel and Google Sheets with plain headers.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center space-x-2">
              <button
                onClick={() => handleExportCSV(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={scrollToCsvSection}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Customize filters and columns before exporting"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Format 5: Markdown / Notes */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition shadow-lg group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Markdown Notes</h3>
              <p className="text-xs text-slate-400 mt-1">
                Clean text drafted in plain words for Notion, Apple Notes, or personal archives.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center space-x-2">
              <button
                onClick={() => copyOrDownloadMarkdown(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center space-x-1"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMd ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => copyOrDownloadMarkdown(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Download .md file"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED TRANSACTION HISTORY CSV EXPORTER */}
      <div id="csv-export-section" className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Transaction History CSV Exporter
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Excel &bull; Google Sheets Compatible
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Filter your transactions by date, flow, or category and export with simple, clear column headers.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Copy CSV string to clipboard"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCsv ? 'CSV Copied!' : 'Copy CSV Text'}</span>
            </button>

            <button
              onClick={() => handleExportCSV(false)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
              title="Download CSV with active filters"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Filtered CSV ({filteredForCsv.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Time Period
            </label>
            <select
              value={csvDateRange}
              onChange={(e) => setCsvDateRange(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Time (Complete History)</option>
              <option value="month">Current Month</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Transaction Flow
            </label>
            <select
              value={csvType}
              onChange={(e) => setCsvType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Flows (Income &amp; Expenses)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category
            </label>
            <select
              value={csvCategory}
              onChange={(e) => setCsvCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Keyword Filter
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search merchant, notes..."
                value={csvSearch}
                onChange={(e) => setCsvSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* CSV Format Options Toggles */}
        <div className="flex items-center space-x-6 text-xs text-slate-300 pt-1 flex-wrap gap-y-2">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={csvIncludeHeaders}
              onChange={(e) => setCsvIncludeHeaders(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
            />
            <span>Include Column Header Row</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={csvIncludeSummary}
              onChange={(e) => setCsvIncludeSummary(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
            />
            <span>Include Simple Totals Block at End</span>
          </label>
        </div>

        {/* Filter Summary Badge Bar */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <span className="text-slate-400 font-medium">Ready for CSV export:</span>
            <span className="font-bold text-white font-mono">{csvStats.count} items</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400 font-mono font-semibold">
              +{formatCurrency(csvStats.income, currency)} Inflow
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-rose-400 font-mono font-semibold">
              -{formatCurrency(csvStats.expense, currency)} Outflow
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-300 font-mono font-semibold">
              Net: {formatCurrency(csvStats.net, currency)}
            </span>
          </div>

          <button
            onClick={() => {
              setCsvDateRange('all');
              setCsvType('all');
              setCsvCategory('all');
              setCsvSearch('');
            }}
            className="text-[11px] text-slate-400 hover:text-white underline transition"
          >
            Reset Filters
          </button>
        </div>

        {/* Live CSV Data Preview Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV Data Preview ({Math.min(filteredForCsv.length, 6)} of {filteredForCsv.length} rows)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Encoding: UTF-8 with BOM (Excel &amp; Sheets compatible)
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-x-auto">
            {filteredForCsv.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No transactions match the selected filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredForCsv.slice(0, 6).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          t.type === 'income' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-white font-medium max-w-[180px] truncate">
                        {t.description}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {t.category}
                      </td>
                      <td className={`py-2 px-3 font-mono text-right font-bold whitespace-nowrap ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                      </td>
                      <td className="py-2 px-3 text-slate-400 capitalize text-[11px]">
                        {(t.paymentMethod || 'card').replace('_', ' ')}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] max-w-[140px] truncate">
                        {t.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS & PREVIEW SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Strategic Recommendations In Simple Words */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {wordingStyle === 'simple' ? 'Simple Steps to Save More' : 'Strategic Financial Recommendations'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {wordingStyle === 'simple' ? 'Clear, practical tips' : 'Personalized AI Guidance'}
              </span>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3">
              {(report?.recommendedActions || [
                {
                  title: 'Cook at Home a Few More Days a Week',
                  impact: 'High',
                  description: 'Eating out or grabbing takeaway just 2 fewer times a week puts easy money right back in your pocket.',
                  potentialSavings: Math.round(totalExpense * 0.08)
                },
                {
                  title: 'Put Away a Small Safety Cushion First',
                  impact: 'High',
                  description: 'Aim for a 3-month living cushion by moving a slice of salary straight to savings on payday.',
                  potentialSavings: Math.round(totalIncome * 0.12)
                },
                {
                  title: 'Cancel Any Subscriptions You Do Not Use',
                  impact: 'Medium',
                  description: 'Check streaming services or apps. Cancelling just 1 or 2 plans saves money every single month.',
                  potentialSavings: Math.round(totalExpense * 0.04)
                }
              ]).map((rec, index) => {
                const isHigh = rec.impact === 'High';
                return (
                  <div 
                    key={index}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/30 transition space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition">
                          {rec.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isHigh 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {rec.impact} Impact
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          +{formatCurrency(rec.potentialSavings, currency)}/mo
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-7">
                      {rec.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Strengths & Risks in Simple Words */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{wordingStyle === 'simple' ? 'What You Are Doing Great' : 'Key Strengths'}</span>
                </span>
                <ul className="text-[11px] text-slate-300 space-y-1">
                  {(report?.keyStrengths || [
                    `You have ${currency}${Math.max(0, netSavings).toLocaleString()} left over every month after bills.`,
                    'You have clear savings goals mapped out with targets.',
                    'Your biggest essential bills stay within a healthy range.'
                  ]).map((str, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400">&bull;</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{wordingStyle === 'simple' ? 'Things to Watch Out For' : 'Areas of Attention'}</span>
                </span>
                <ul className="text-[11px] text-slate-300 space-y-1">
                  {(report?.criticalRisks || [
                    'Eating out and food orders make up a big part of your monthly spending.',
                    'Keep your emergency fund growing so you are protected against surprises.',
                    'Monthly recurring app charges can easily go unnoticed.'
                  ]).map((risk, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-400">&bull;</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Document Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Document Preview</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {transactions.length} items &bull; {categories.length} categories
              </span>
            </div>

            {/* Document Card Shell */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3.5 text-xs text-slate-300">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">AISmartBudget Simple Summary</span>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Grade {report?.healthGrade || 'A'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  As of: {new Date().toLocaleDateString()} &bull; Drafted in Plain Words
                </p>
              </div>

              {/* Summary Snippet */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  {wordingStyle === 'simple' ? 'Summary in Plain Words' : 'Executive Audit Summary'}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report?.summary || `You brought in ${currency}${totalIncome.toLocaleString()} and spent ${currency}${totalExpense.toLocaleString()}, leaving ${currency}${netSavings.toLocaleString()} in your pocket (${savingsRate}% saved).`}
                </p>
              </div>

              {/* Where Money Went */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  {wordingStyle === 'simple' ? 'Where Your Money Went' : 'Category Allocation'}
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {categorySpending.slice(0, 4).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">{c.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400">{currency}{c.spent.toLocaleString()}</span>
                        <span className={`text-[10px] font-bold ${c.isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {c.percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons inside Preview */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={generateSummaryPDF}
                  disabled={exportingSummaryPdf}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  title="Download PDF summary in simple words"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-slate-950" />
                  <span>{exportingSummaryPdf ? 'Generating...' : 'Download Summary PDF'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={generatePDF}
                    disabled={exportingPdf}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Complete PDF</span>
                  </button>
                  <button
                    onClick={downloadDriveDocument}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Drive Doc</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BACKEND CONNECTION & ARCHITECTURE MODAL */}
      {showBackendGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Backend Architecture &amp; Connection</h3>
                  <p className="text-xs text-slate-400">How the frontend and backend are wired together</p>
                </div>
              </div>
              <button
                onClick={() => setShowBackendGuide(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Server Status</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">
                    {backendHealth?.status === 'ok' ? 'Online' : 'Connected'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Runtime Port</span>
                <p className="text-xs font-bold text-white font-mono">Port 3000</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Server Framework</span>
                <p className="text-xs font-bold text-white font-mono">Express.js (TS)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Synced Items</span>
                <p className="text-xs font-bold text-emerald-400 font-mono">
                  {transactions.length} tx &bull; {categories.length} cat
                </p>
              </div>
            </div>

            {/* Step-by-step Guide */}
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-bold">1</span>
                  <span>How It Connects Right Now (Already Working)</span>
                </h4>
                <p className="text-slate-400 leading-relaxed pl-7">
                  This application is a <strong>unified full-stack Express + React application</strong>. In development, <code className="text-emerald-300 font-mono">server.ts</code> mounts Vite's middlewares on port 3000. In production, Express directly serves the compiled assets.
                </p>
                <div className="pl-7 pt-1 font-mono text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500">// Frontend makes relative calls - zero CORS configuration needed:</span><br />
                  <span className="text-emerald-400">const</span> res = <span className="text-blue-400">await</span> fetch(<span className="text-amber-300">'/api/data'</span>);<br />
                  <span className="text-emerald-400">const</span> json = <span className="text-blue-400">await</span> res.json();
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>How to Run Locally on Your Machine</span>
                </h4>
                <p className="text-slate-400 leading-relaxed pl-7">
                  To run this exact full-stack application on your computer:
                </p>
                <div className="pl-7 space-y-1.5 font-mono text-[11px]">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                    <span className="text-slate-500"># 1. Install dependencies</span><br />
                    npm install<br /><br />
                    <span className="text-slate-500"># 2. Add your Gemini API Key in .env</span><br />
                    echo "GEMINI_API_KEY=your_gemini_api_key_here" &gt; .env<br /><br />
                    <span className="text-slate-500"># 3. Start development server (Port 3000)</span><br />
                    npm run dev
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-center font-bold">3</span>
                  <span>Active REST Endpoints Reference</span>
                </h4>
                <div className="pl-7 space-y-1 font-mono text-[11px] text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-emerald-400 font-bold">GET /api/health</span>
                    <span className="text-slate-500">Server status, uptime &amp; DB count</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-emerald-400 font-bold">GET /api/data</span>
                    <span className="text-slate-500">Fetch persisted transactions &amp; goals</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-blue-400 font-bold">POST /api/data</span>
                    <span className="text-slate-500">Auto-sync full financial state to server</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-blue-400 font-bold">POST /api/transactions</span>
                    <span className="text-slate-500">Save a single new transaction</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-rose-400 font-bold">DELETE /api/transactions/:id</span>
                    <span className="text-slate-500">Delete transaction on backend</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-purple-400 font-bold">POST /api/ai/audit</span>
                    <span className="text-slate-500">Gemini 3.8 Flash financial audit</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-purple-400 font-bold">POST /api/ai/chat</span>
                    <span className="text-slate-500">Personal money coach conversation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setShowBackendGuide(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
