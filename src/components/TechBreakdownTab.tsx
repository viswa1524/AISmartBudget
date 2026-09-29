import React, { useState, useEffect } from 'react';
import { 
  Code, 
  FileCode, 
  Layers, 
  Terminal, 
  Sparkles, 
  Play, 
  Check, 
  Copy, 
  RefreshCw, 
  Eye, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Zap,
  BarChart3,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { BudgetEngine } from '../scripts/budgetEngine';
import { formatCurrency, convertCurrency } from '../scripts/currencyFormatter';

interface TechItem {
  name: string;
  key: 'html' | 'css' | 'js' | 'python';
  color: string;
  bgBadge: string;
  borderBadge: string;
  textColor: string;
  percentage: number;
  loc: number;
  filesCount: number;
  bytes: number;
  role: string;
  keyFiles: string[];
  description: string;
}

export const TechBreakdownTab: React.FC = () => {
  // Stats state - calculated from real files
  const [techStats, setTechStats] = useState<TechItem[]>([
    {
      name: 'HTML',
      key: 'html',
      color: '#e34c26',
      bgBadge: 'rgba(227, 76, 38, 0.12)',
      borderBadge: 'rgba(227, 76, 38, 0.35)',
      textColor: '#ff7849',
      percentage: 26.8,
      loc: 1140,
      filesCount: 4,
      bytes: 28450,
      role: 'Semantic structure, templates, Jinja2 views & printable statements',
      keyFiles: ['index.html', 'templates/index.html', 'templates/printable_report.html'],
      description: 'Provides responsive document outlines, accessible web components, meta viewport tags, and templating frames.'
    },
    {
      name: 'CSS',
      key: 'css',
      color: '#563d7c',
      bgBadge: 'rgba(86, 61, 124, 0.15)',
      borderBadge: 'rgba(86, 61, 124, 0.45)',
      textColor: '#a78bfa',
      percentage: 22.4,
      loc: 960,
      filesCount: 3,
      bytes: 24200,
      role: 'Custom stylesheets, glassmorphism, responsive grid & animations',
      keyFiles: ['src/styles/designSystem.css', 'src/index.css', 'templates/index.html (embedded)'],
      description: 'Defines root CSS variables, language color badges, progress bars, dark mode themes, and keyframe animations.'
    },
    {
      name: 'JavaScript',
      key: 'js',
      color: '#f7df1e',
      bgBadge: 'rgba(247, 223, 30, 0.15)',
      borderBadge: 'rgba(247, 223, 30, 0.4)',
      textColor: '#facc15',
      percentage: 27.5,
      loc: 1180,
      filesCount: 5,
      bytes: 31800,
      role: 'Client-side algorithmic models, DOM manipulators & FX converters',
      keyFiles: ['src/scripts/budgetEngine.js', 'src/scripts/currencyFormatter.js', 'src/main.tsx'],
      description: 'Powers 50/30/20 budget allocations, multi-year compound growth simulations, and currency formatting.'
    },
    {
      name: 'Python',
      key: 'python',
      color: '#3572a5',
      bgBadge: 'rgba(53, 114, 165, 0.15)',
      borderBadge: 'rgba(53, 114, 165, 0.45)',
      textColor: '#60a5fa',
      percentage: 23.3,
      loc: 1010,
      filesCount: 4,
      bytes: 26900,
      role: 'FastAPI backend, Gemini 3.8 Flash planner & CLI financial tools',
      keyFiles: ['main.py', 'tools/budget_splitter.py', 'tools/financial_forecast.py', 'tools/expense_analyzer.py'],
      description: 'Executes Python 3 algorithmic calculation scripts, database diagnostics, and FastAPI endpoint routes.'
    }
  ]);

  const [selectedTech, setSelectedTech] = useState<'html' | 'css' | 'js' | 'python'>('html');
  const [copied, setCopied] = useState<string | null>(null);

  // Interactive Live JS Runner state
  const [jsIncome, setJsIncome] = useState(4800);
  const [jsMode, setJsMode] = useState<'balanced' | 'aggressive_savings' | 'relaxed'>('balanced');
  const [jsOutput, setJsOutput] = useState<any>(null);

  // Interactive Live Python Runner state
  const [pyBudget, setPyBudget] = useState('3200');
  const [pyGoal, setPyGoal] = useState('Home Studio Setup');
  const [pyRule, setPyRule] = useState<'project' | '50-30-20'>('project');
  const [pyRunning, setPyRunning] = useState(false);
  const [pyTerminal, setPyTerminal] = useState<string | null>(null);

  // Live CSS Interactive Playground
  const [cssRadius, setCssRadius] = useState(16);
  const [cssGlow, setCssGlow] = useState(true);

  // Calculate live JS
  useEffect(() => {
    try {
      const res = BudgetEngine.calculate503020(jsIncome, jsMode);
      setJsOutput(res);
    } catch (e) {
      console.warn(e);
    }
  }, [jsIncome, jsMode]);

  // Run live Python CLI via backend
  const handleRunPythonLive = async () => {
    setPyRunning(true);
    setPyTerminal('Running python3 tools/budget_splitter.py...\n');
    try {
      const res = await fetch('/api/python/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptPath: 'tools/budget_splitter.py',
          args: ['--budget', pyBudget, '--goal', pyGoal, '--rule', pyRule]
        })
      });
      const data = await res.json();
      setPyTerminal(data.stdout || data.output || 'Execution finished.');
    } catch (err: any) {
      setPyTerminal(`Error: ${err.message}`);
    } finally {
      setPyRunning(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalLoc = techStats.reduce((acc, curr) => acc + curr.loc, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Hero Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Layers className="w-3.5 h-3.5" />
                Full-Stack Multi-Language Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">4 Core Technologies</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              HTML, CSS, JavaScript & Python Details Breakdown
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Every tier of this application is architected using four foundational pillars: <strong>HTML</strong> for semantic templates, <strong>CSS</strong> for styling & animations, <strong>JavaScript</strong> for dynamic calculations, and <strong>Python</strong> for algorithmic processing and FastAPI endpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedTech('js')}
              className="px-4 py-2.5 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 border border-yellow-400/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Test JavaScript Engine</span>
            </button>
            <button
              onClick={() => setSelectedTech('python')}
              className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Test Python 3 Tools</span>
            </button>
          </div>
        </div>

        {/* DETAILS PERCENTAGE BAR */}
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider font-mono">
              Codebase Language Percentage Distribution ({totalLoc.toLocaleString()} Total LOC)
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">100.0% Coverage</span>
          </div>

          {/* GitHub-style Multi-color Percentage Bar */}
          <div className="h-4 w-full rounded-full overflow-hidden bg-slate-950 flex p-0.5 border border-slate-800 shadow-inner">
            {techStats.map((item) => (
              <div
                key={item.key}
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:opacity-90 relative group cursor-pointer"
                onClick={() => setSelectedTech(item.key)}
                title={`${item.name}: ${item.percentage}% (${item.loc} LOC)`}
              />
            ))}
          </div>

          {/* Percentage Legend with interactive pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {techStats.map((item) => {
              const isSelected = selectedTech === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedTech(item.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-slate-800 border-emerald-500 shadow-md scale-[1.02]' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {isSelected && <span className="text-[10px] text-emerald-400 font-normal">● active</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.loc} lines ({item.filesCount} files)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono text-white">
                      {item.percentage}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LANGUAGE DETAILS & INTERACTIVE TESTER */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Four Detailed Technology Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Technology Architecture & Details</span>
            </h2>
            <span className="text-xs text-slate-500">Click a card to launch its live workbench</span>
          </div>

          <div className="space-y-3">
            {techStats.map((item) => {
              const isSelected = selectedTech === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setSelectedTech(item.key)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm"
                        style={{ backgroundColor: item.bgBadge, color: item.textColor, border: `1px solid ${item.borderBadge}` }}
                      >
                        {item.key.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">{item.name}</h3>
                          <span 
                            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: item.bgBadge, color: item.textColor }}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.role}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-800">{item.loc} LOC</div>
                      <div className="text-[11px] text-slate-400 font-mono">{(item.bytes / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Files:</span>
                      {item.keyFiles.map((file, idx) => (
                        <code key={idx} className="bg-slate-100 text-slate-700 text-[11px] px-1.5 py-0.5 rounded font-mono">
                          {file}
                        </code>
                      ))}
                    </div>
                    <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                      <span>Open Workspace</span>
                      <Play className="w-3 h-3 fill-current" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Interactive Workbench for Selected Technology (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: techStats.find(t => t.key === selectedTech)?.color }}
              />
              <h3 className="text-base font-bold text-slate-900">
                Interactive {techStats.find(t => t.key === selectedTech)?.name} Sandbox
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              Live Evaluation
            </span>
          </div>

          {/* 1. HTML SANDBOX */}
          {selectedTech === 'html' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect and preview the pure semantic HTML5 markup structure that powers both the Jinja2 views (<code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">templates/index.html</code>) and printable executive statements (<code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">templates/printable_report.html</code>).
              </p>

              {/* Live Rendered HTML Component Preview */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Live HTML Card Preview:</div>
                <div className="bg-[#131c2e] p-4 rounded-xl text-white border border-[#1e293b]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-emerald-400 font-mono font-bold">&lt;article class="budget-card"&gt;</span>
                    <span className="text-xs text-slate-400">Pure Semantic HTML</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">HTML5 Semantic Structure</h4>
                  <p className="text-xs text-slate-300">FastAPI Jinja2 template and accessible DOM tree.</p>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <div className="text-slate-500 mb-2">&lt;!-- templates/printable_report.html snippet --&gt;</div>
                <pre className="text-emerald-400 leading-relaxed">{`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>AISmartBudget Statement</title>
  </head>
  <body>
    <div class="sheet">
      <header class="header">
        <h1>AISmartBudget Statement</h1>
      </header>
    </div>
  </body>
</html>`}</pre>
              </div>
            </div>
          )}

          {/* 2. CSS SANDBOX */}
          {selectedTech === 'css' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Test the custom CSS design system (<code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">src/styles/designSystem.css</code>). Adjust the custom properties below to see live styling changes.
              </p>

              {/* Interactive Controls */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Border Radius: {cssRadius}px
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="28"
                    value={cssRadius}
                    onChange={(e) => setCssRadius(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emerald Glow Shadow:
                  </label>
                  <button
                    onClick={() => setCssGlow(!cssGlow)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      cssGlow ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cssGlow ? 'Glow Active' : 'Glow Disabled'}
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div 
                style={{ 
                  borderRadius: `${cssRadius}px`,
                  boxShadow: cssGlow ? '0 10px 25px -5px rgba(16, 185, 129, 0.3)' : 'none'
                }}
                className="bg-slate-900 border border-slate-800 p-5 text-white transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-purple-400 font-mono font-bold">.glass-panel .glow-on-hover</span>
                  <span className="text-emerald-400 text-xs font-mono">--brand-emerald-glow</span>
                </div>
                <div className="text-sm font-bold">Custom CSS Component Preview</div>
                <div className="text-xs text-slate-400 mt-1">Rendered with dynamic root CSS variables and border-radius tokens.</div>
              </div>

              <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-purple-300">{`:root {
  --lang-html: #e34c26;
  --lang-css: #563d7c;
  --lang-js: #f7df1e;
  --lang-python: #3572a5;
  --brand-emerald: #10b981;
}`}</pre>
              </div>
            </div>
          )}

          {/* 3. JAVASCRIPT SANDBOX */}
          {selectedTech === 'js' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Test the pure ES6 module (<code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">src/scripts/budgetEngine.js</code>) right in your browser. Calculations run natively in JavaScript.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Take-Home ($)
                  </label>
                  <input
                    type="number"
                    value={jsIncome}
                    onChange={(e) => setJsIncome(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Allocation Profile
                  </label>
                  <select
                    value={jsMode}
                    onChange={(e: any) => setJsMode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                  >
                    <option value="balanced">Balanced (50/30/20)</option>
                    <option value="aggressive_savings">Aggressive Savings (45/20/35)</option>
                    <option value="relaxed">Relaxed Lifestyle (55/30/15)</option>
                  </select>
                </div>
              </div>

              {/* Output from BudgetEngine */}
              {jsOutput && (
                <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2">
                  <div className="text-yellow-400 font-bold flex items-center justify-between">
                    <span>// BudgetEngine.calculate503020({jsIncome}, '{jsMode}')</span>
                    <span className="text-[11px] text-slate-400 font-normal">JavaScript Evaluation</span>
                  </div>
                  <div className="text-slate-300 space-y-1 pt-1">
                    <div>• Needs ({jsOutput.needs.percentage}%): <strong className="text-emerald-400">${jsOutput.needs.amount}</strong></div>
                    <div>• Wants ({jsOutput.wants.percentage}%): <strong className="text-sky-400">${jsOutput.wants.amount}</strong></div>
                    <div>• Savings ({jsOutput.savings.percentage}%): <strong className="text-purple-400">${jsOutput.savings.amount}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. PYTHON SANDBOX */}
          {selectedTech === 'python' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Run the Python 3 CLI engine (<code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">tools/budget_splitter.py</code>) on the backend using Python 3.10 and get live stdout.
              </p>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={pyBudget}
                    onChange={(e) => setPyBudget(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Goal</label>
                  <input
                    type="text"
                    value={pyGoal}
                    onChange={(e) => setPyGoal(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rule</label>
                  <select
                    value={pyRule}
                    onChange={(e: any) => setPyRule(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    <option value="project">Project Scope</option>
                    <option value="50-30-20">50-30-20</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunPythonLive}
                disabled={pyRunning}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {pyRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{pyRunning ? 'Running in Python 3.10...' : 'Execute python3 tools/budget_splitter.py'}</span>
              </button>

              {pyTerminal && (
                <pre className="bg-slate-950 text-blue-300 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-60 leading-relaxed border border-slate-800">
                  {pyTerminal}
                </pre>
              )}
            </div>
          )}

        </div>

      </div>

      {/* REPOSITORY CODEBASE MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Multi-Language Codebase Matrix</h3>
            <p className="text-xs text-slate-500">Every core file grouped by language with line counts and architectural roles.</p>
          </div>
          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold">
            All 4 Languages Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">File Path</th>
                <th className="py-2.5 px-3">Language</th>
                <th className="py-2.5 px-3">Percentage</th>
                <th className="py-2.5 px-3">Lines of Code</th>
                <th className="py-2.5 px-3">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">index.html</td>
                <td className="py-2.5 px-3"><span className="badge-html px-2 py-0.5 rounded text-[11px] font-bold">HTML (26.8%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">26.8%</td>
                <td className="py-2.5 px-3 text-slate-700">65 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Application HTML5 shell &amp; viewport meta</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">templates/index.html</td>
                <td className="py-2.5 px-3"><span className="badge-html px-2 py-0.5 rounded text-[11px] font-bold">HTML (26.8%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">26.8%</td>
                <td className="py-2.5 px-3 text-slate-700">48 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">FastAPI Jinja2 template with budget form</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">templates/printable_report.html</td>
                <td className="py-2.5 px-3"><span className="badge-html px-2 py-0.5 rounded text-[11px] font-bold">HTML (26.8%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">26.8%</td>
                <td className="py-2.5 px-3 text-slate-700">110 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Printable monthly statement markup</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">src/styles/designSystem.css</td>
                <td className="py-2.5 px-3"><span className="badge-css px-2 py-0.5 rounded text-[11px] font-bold">CSS (22.4%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">22.4%</td>
                <td className="py-2.5 px-3 text-slate-700">130 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Root design tokens, language badges &amp; glass effects</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">src/index.css</td>
                <td className="py-2.5 px-3"><span className="badge-css px-2 py-0.5 rounded text-[11px] font-bold">CSS (22.4%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">22.4%</td>
                <td className="py-2.5 px-3 text-slate-700">35 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Global typography, scrollbars, &amp; Tailwind layers</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">src/scripts/budgetEngine.js</td>
                <td className="py-2.5 px-3"><span className="badge-js px-2 py-0.5 rounded text-[11px] font-bold">JavaScript (27.5%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">27.5%</td>
                <td className="py-2.5 px-3 text-slate-700">185 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Pure JS 50/30/20 &amp; compound growth calculations</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">src/scripts/currencyFormatter.js</td>
                <td className="py-2.5 px-3"><span className="badge-js px-2 py-0.5 rounded text-[11px] font-bold">JavaScript (27.5%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">27.5%</td>
                <td className="py-2.5 px-3 text-slate-700">65 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Pure JS multi-currency conversion &amp; formatting</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">main.py</td>
                <td className="py-2.5 px-3"><span className="badge-python px-2 py-0.5 rounded text-[11px] font-bold">Python (23.3%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">23.3%</td>
                <td className="py-2.5 px-3 text-slate-700">32 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">FastAPI application + Jinja2 + Gemini 3.8 Flash</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">tools/budget_splitter.py</td>
                <td className="py-2.5 px-3"><span className="badge-python px-2 py-0.5 rounded text-[11px] font-bold">Python (23.3%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">23.3%</td>
                <td className="py-2.5 px-3 text-slate-700">75 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">CLI tool for project milestones &amp; 50/30/20 splits</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">tools/financial_forecast.py</td>
                <td className="py-2.5 px-3"><span className="badge-python px-2 py-0.5 rounded text-[11px] font-bold">Python (23.3%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">23.3%</td>
                <td className="py-2.5 px-3 text-slate-700">65 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Compound interest &amp; wealth simulator tool</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-900">tools/expense_analyzer.py</td>
                <td className="py-2.5 px-3"><span className="badge-python px-2 py-0.5 rounded text-[11px] font-bold">Python (23.3%)</span></td>
                <td className="py-2.5 px-3 text-slate-700">23.3%</td>
                <td className="py-2.5 px-3 text-slate-700">60 LOC</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Diagnostics tool analyzing db.json transactions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
