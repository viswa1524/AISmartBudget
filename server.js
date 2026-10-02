/**
 * PocketSmart AI - Server Engine
 * Implements FastAPI & Jinja2 Template rendering for PocketSmart AI
 * Supports full CRUD for Income, Expenses, Monthly Budget, Dashboard, and Gemini AI Recommendations.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const PORT = parseInt(process.env.APP_PORT || '3000', 10);
const ROOT = __dirname;

// Read .env if present and enforce strict file permissions (chmod 600)
try {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    try {
      fs.chmodSync(envPath, 0o600);
    } catch (permErr) {}

    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const k = match[1];
        let val = match[2] || '';
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[k] || !process.env[k].trim()) {
          process.env[k] = val.trim();
        }
      }
    }
  }
} catch (e) {}

const DB_FILE = path.join(ROOT, 'pocketsmart_store.json');
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Education',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Other'
];

// Persistent SQLite-equivalent store
function readData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading database file:', e);
  }
  const initial = {
    budget: 0.0,
    income: [
      { id: 1, source: 'Scholarship / Allowance', amount: 15000.0, date: '2026-09-01', description: 'Monthly allowance' }
    ],
    expenses: [
      { id: 1, category: 'Food', amount: 3500.0, date: '2026-09-05', description: 'Grocery and mess fees' },
      { id: 2, category: 'Education', amount: 2000.0, date: '2026-09-10', description: 'Books and stationery' },
      { id: 3, category: 'Transport', amount: 1200.0, date: '2026-09-15', description: 'Metro pass recharge' }
    ]
  };
  writeData(initial);
  return initial;
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing database file:', e);
  }
}

function computeSummary(data) {
  const total_income = (data.income || []).reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
  const total_expenses = (data.expenses || []).reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const budget = parseFloat(data.budget) || 0.0;
  const remaining_balance = total_income - total_expenses;

  let budget_used_pct = 0.0;
  if (budget > 0) {
    budget_used_pct = Math.round((total_expenses / budget) * 1000) / 10;
  }

  const category_summary = {};
  for (const cat of EXPENSE_CATEGORIES) {
    const sum = (data.expenses || [])
      .filter(e => e.category === cat)
      .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    if (sum > 0) {
      category_summary[cat] = sum;
    }
  }

  let warning = null;
  if (budget > 0) {
    if (budget_used_pct >= 100) {
      warning = 'You have exceeded your monthly budget!';
    } else if (budget_used_pct >= 80) {
      warning = 'You are close to your monthly budget limit.';
    }
  }

  return {
    total_income,
    total_expenses,
    remaining_balance,
    budget,
    budget_used_pct,
    category_summary,
    warning
  };
}

function getApiKey() {
  // Check process.env first
  const envKey = (process.env.GEMINI_API_KEY || '').trim();
  if (envKey && !envKey.startsWith('MY_') && envKey !== 'your_actual_key_here') {
    return envKey;
  }

  // Check securely loaded .env file
  try {
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const m = content.match(/^GEMINI_API_KEY\s*=\s*([^\r\n#]+)/m);
      if (m && m[1]) {
        const key = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('MY_') && key !== 'your_actual_key_here') {
          return key;
        }
      }
    }
  } catch (e) {}

  return '';
}

// Call Google Gemini API
function callGemini(context) {
  return new Promise((resolve) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return resolve({
        success: false,
        error: 'GEMINI_API_KEY is not set. Add it to your .env file to enable AI recommendations.'
      });
    }

    const categoryLines = Object.keys(context.category_summary || {}).length > 0
      ? Object.entries(context.category_summary).map(([cat, amt]) => `  - ${cat}: ${Number(amt).toFixed(2)}`).join('\n')
      : '  - No expenses recorded yet.';

    const prompt = `You are a friendly, practical personal finance assistant. Based on the financial snapshot below, give the user 3 to 5 short, numbered, specific budgeting tips. Reference the actual numbers where it helps. Keep the entire answer under 200 words and avoid generic filler advice.

Monthly income: ${Number(context.total_income || 0).toFixed(2)}
Monthly expenses: ${Number(context.total_expenses || 0).toFixed(2)}
Monthly budget: ${Number(context.monthly_budget || 0).toFixed(2)}
Remaining balance: ${Number(context.remaining_balance || 0).toFixed(2)}
Spending by category:
${categoryLines}
`;

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    function tryModel(index) {
      if (index >= GEMINI_MODELS.length) {
        return resolve({
          success: false,
          error: 'Gemini service is currently unavailable. Please try again shortly.'
        });
      }

      const model = GEMINI_MODELS[index];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-goog-api-key': apiKey
        },
        timeout: 15000
      }, (res) => {
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => {
          console.log(`[Gemini API] ${model} status:`, res.statusCode, resBody.slice(0, 200));
          try {
            const json = JSON.parse(resBody);
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return resolve({ success: true, recommendation: text.trim() });
            }
          } catch (e) {
            console.error('[Gemini API] Parse error:', e);
          }
          tryModel(index + 1);
        });
      });

      req.on('error', (err) => {
        console.error(`[Gemini API] Request error for ${model}:`, err);
        tryModel(index + 1);
      });
      req.on('timeout', () => {
        console.error(`[Gemini API] Timeout for ${model}`);
        req.destroy();
        tryModel(index + 1);
      });
      req.write(payload);
      req.end();
    }

    tryModel(0);
  });
}

// -------------------------------------------------------------
// Jinja2 Template Rendering Engine
// -------------------------------------------------------------
function renderTemplate(viewName, data = {}) {
  const baseTpl = fs.readFileSync(path.join(ROOT, 'templates', 'base.html'), 'utf-8');
  const viewPath = path.join(ROOT, 'templates', viewName);
  if (!fs.existsSync(viewPath)) {
    return '<h1>Template not found</h1>';
  }
  const childTpl = fs.readFileSync(viewPath, 'utf-8');

  // Extract block title
  const titleMatch = childTpl.match(/{%\s*block\s+title\s*%}([\s\S]*?){%\s*endblock\s*%}/);
  const pageTitle = titleMatch ? titleMatch[1].trim() : 'PocketSmart AI';

  // Extract block content
  const contentMatch = childTpl.match(/{%\s*block\s+content\s*%}([\s\S]*?){%\s*endblock\s*%}/);
  let content = contentMatch ? contentMatch[1] : childTpl;

  // Render specific view logic
  content = renderViewContent(viewName, content, data);

  // Inject into base.html
  let rendered = baseTpl
    .replace(/{%\s*block\s+title\s*%}[\s\S]*?{%\s*endblock\s*%}/, pageTitle)
    .replace(/{%\s*block\s+content\s*%}[\s\S]*?{%\s*endblock\s*%}/, content);

  return rendered;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderViewContent(viewName, raw, data) {
  let html = raw;

  if (viewName === 'index.html') {
    return html;
  }

  if (viewName === 'recommendations.html') {
    return html;
  }

  if (viewName === 'dashboard.html') {
    const summary = data.summary || {};
    const recent_income = data.recent_income || [];
    const recent_expenses = data.recent_expenses || [];

    // Warning
    if (summary.warning) {
      html = html.replace(/{%\s*if\s+summary\.warning\s*%}([\s\S]*?){%\s*endif\s*%}/, `<div class="alert alert-warning"><svg class="alert-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>${escapeHtml(summary.warning)}</span></div>`);
    } else {
      html = html.replace(/{%\s*if\s+summary\.warning\s*%}([\s\S]*?){%\s*endif\s*%}/, '');
    }

    // Amounts
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.total_income\)\s*}}/, summary.total_income.toFixed(2));
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.total_expenses\)\s*}}/, summary.total_expenses.toFixed(2));
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.remaining_balance\)\s*}}/, summary.remaining_balance.toFixed(2));
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.budget\)\s*}}/, summary.budget.toFixed(2));
    html = html.replace(/{{\s*summary\.budget_used_pct\s*}}/, summary.budget_used_pct);

    // Balance class
    const balClass = summary.remaining_balance < 0 ? 'expense' : 'income';
    html = html.replace(/{%\s*if\s+summary\.remaining_balance\s*<\s*0\s*%}expense{%\s*else\s*%}income{%\s*endif\s*%}/, balClass);

    // Progress bar class & width
    let pClass = '';
    if (summary.budget_used_pct >= 100) pClass = 'danger';
    else if (summary.budget_used_pct >= 80) pClass = 'warn';
    html = html.replace(/{%\s*if\s+summary\.budget_used_pct\s*>=\s*100\s*%}danger{%\s*elif\s+summary\.budget_used_pct\s*>=\s*80\s*%}warn{%\s*endif\s*%}/, pClass);
    html = html.replace(/{{\s*\[summary\.budget_used_pct,\s*100\]\s*\|\s*min\s*}}/, Math.min(summary.budget_used_pct, 100));

    // Category summary
    const catEntries = Object.entries(summary.category_summary || {});
    if (catEntries.length > 0) {
      let chartHtml = '<div class="bar-chart">';
      for (const [cat, amt] of catEntries) {
        const pct = summary.total_expenses ? ((amt / summary.total_expenses) * 100).toFixed(1) : 0;
        chartHtml += `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(cat)}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="bar-value">₹${amt.toFixed(2)}</span>
          </div>`;
      }
      chartHtml += '</div>';
      html = html.replace(/{%\s*if\s+summary\.category_summary\s*%}[\s\S]*?{%\s*endif\s*%}/, chartHtml);
    } else {
      html = html.replace(/{%\s*if\s+summary\.category_summary\s*%}[\s\S]*?{%\s*endif\s*%}/, '<p class="empty">No expenses recorded yet.</p>');
    }

    // Recent Income
    if (recent_income.length > 0) {
      let incRows = '';
      for (const i of recent_income) {
        incRows += `<tr><td>${escapeHtml(i.date)}</td><td>${escapeHtml(i.source)}</td><td>₹${Number(i.amount).toFixed(2)}</td></tr>`;
      }
      const incTable = `<table><thead><tr><th>Date</th><th>Source</th><th>Amount</th></tr></thead><tbody>${incRows}</tbody></table>`;
      html = html.replace(/{%\s*if\s+recent_income\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, incTable);
    } else {
      html = html.replace(/{%\s*if\s+recent_income\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, '<p class="empty">No income recorded yet.</p>');
    }

    // Recent Expenses
    if (recent_expenses.length > 0) {
      let expRows = '';
      for (const e of recent_expenses) {
        expRows += `<tr><td>${escapeHtml(e.date)}</td><td>${escapeHtml(e.category)}</td><td>₹${Number(e.amount).toFixed(2)}</td></tr>`;
      }
      const expTable = `<table><thead><tr><th>Date</th><th>Category</th><th>Amount</th></tr></thead><tbody>${expRows}</tbody></table>`;
      html = html.replace(/{%\s*if\s+recent_expenses\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, expTable);
    } else {
      html = html.replace(/{%\s*if\s+recent_expenses\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, '<p class="empty">No expenses recorded yet.</p>');
    }

    return html;
  }

  if (viewName === 'income.html') {
    const income_list = data.income_list || [];
    const total_income = data.total_income || 0;
    const error = data.error;

    if (error) {
      html = html.replace(/{%\s*if\s+error\s*%}[\s\S]*?{%\s*endif\s*%}/, `<div class="alert alert-error"><svg class="alert-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${escapeHtml(error)}</span></div>`);
    } else {
      html = html.replace(/{%\s*if\s+error\s*%}[\s\S]*?{%\s*endif\s*%}/, '');
    }

    html = html.replace(/{{\s*"%\.2f"\|format\(total_income\)\s*}}/, total_income.toFixed(2));

    if (income_list.length > 0) {
      let rows = '';
      for (const i of income_list) {
        rows += `
          <tr>
            <td>${escapeHtml(i.date)}</td>
            <td>${escapeHtml(i.source)}</td>
            <td>₹${Number(i.amount).toFixed(2)}</td>
            <td>${escapeHtml(i.description || '-')}</td>
            <td>
              <form method="post" action="/income/delete/${i.id}" onsubmit="return confirm('Delete this income entry?');">
                <button type="submit" class="btn-small btn-danger">
                  <svg class="btn-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  <span>Delete</span>
                </button>
              </form>
            </td>
          </tr>`;
      }
      const tableHtml = `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Description</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
      html = html.replace(/{%\s*if\s+income_list\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, tableHtml);
    } else {
      html = html.replace(/{%\s*if\s+income_list\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, '<p class="empty">No income recorded yet.</p>');
    }

    return html;
  }

  if (viewName === 'expenses.html') {
    const expense_list = data.expense_list || [];
    const total_expenses = data.total_expenses || 0;
    const categories = data.categories || EXPENSE_CATEGORIES;
    const error = data.error;

    if (error) {
      html = html.replace(/{%\s*if\s+error\s*%}[\s\S]*?{%\s*endif\s*%}/, `<div class="alert alert-error"><svg class="alert-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${escapeHtml(error)}</span></div>`);
    } else {
      html = html.replace(/{%\s*if\s+error\s*%}[\s\S]*?{%\s*endif\s*%}/, '');
    }

    // Categories dropdown options
    let catOptions = '';
    for (const c of categories) {
      catOptions += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>\n`;
    }
    html = html.replace(/{%\s*for\s+c\s+in\s+categories\s*%}[\s\S]*?{%\s*endfor\s*%}/, catOptions);

    html = html.replace(/{{\s*"%\.2f"\|format\(total_expenses\)\s*}}/, total_expenses.toFixed(2));

    if (expense_list.length > 0) {
      let rows = '';
      for (const e of expense_list) {
        rows += `
          <tr>
            <td>${escapeHtml(e.date)}</td>
            <td><span class="category-pill">${escapeHtml(e.category)}</span></td>
            <td>₹${Number(e.amount).toFixed(2)}</td>
            <td>${escapeHtml(e.description || '-')}</td>
            <td>
              <form method="post" action="/expenses/delete/${e.id}" onsubmit="return confirm('Delete this expense entry?');">
                <button type="submit" class="btn-small btn-danger">
                  <svg class="btn-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  <span>Delete</span>
                </button>
              </form>
            </td>
          </tr>`;
      }
      const tableHtml = `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
      html = html.replace(/{%\s*if\s+expense_list\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, tableHtml);
    } else {
      html = html.replace(/{%\s*if\s+expense_list\s*%}[\s\S]*?{%\s*else\s*%}[\s\S]*?{%\s*endif\s*%}/, '<p class="empty">No expenses recorded yet.</p>');
    }

    return html;
  }

  if (viewName === 'budget.html') {
    const summary = data.summary || {};
    const error = data.error;

    if (error) {
      html = html.replace(/{%\s*if\s+error\s*%}[\s\S]*?{%\s*endif\s*%}/, `<div class="alert alert-error"><svg class="alert-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${escapeHtml(error)}</span></div>`);
    } else {
      html = html.replace(/{%\s*if\s+error\s*%}[\s\S]*?{%\s*endif\s*%}/, '');
    }

    if (summary.warning) {
      html = html.replace(/{%\s*if\s+summary\.warning\s*%}[\s\S]*?{%\s*endif\s*%}/, `<div class="alert alert-warning"><svg class="alert-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>${escapeHtml(summary.warning)}</span></div>`);
    } else {
      html = html.replace(/{%\s*if\s+summary\.warning\s*%}[\s\S]*?{%\s*endif\s*%}/, '');
    }

    html = html.replace(/{{\s*summary\.budget\s*}}/, summary.budget);
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.total_expenses\)\s*}}/, summary.total_expenses.toFixed(2));
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.budget\)\s*}}/, summary.budget.toFixed(2));
    html = html.replace(/{{\s*summary\.budget_used_pct\s*}}/, summary.budget_used_pct);
    html = html.replace(/{{\s*"%\.2f"\|format\(summary\.budget\s*-\s*summary\.total_expenses\)\s*}}/, (summary.budget - summary.total_expenses).toFixed(2));

    let pClass = '';
    if (summary.budget_used_pct >= 100) pClass = 'danger';
    else if (summary.budget_used_pct >= 80) pClass = 'warn';
    html = html.replace(/{%\s*if\s+summary\.budget_used_pct\s*>=\s*100\s*%}danger{%\s*elif\s+summary\.budget_used_pct\s*>=\s*80\s*%}warn{%\s*endif\s*%}/, pClass);
    html = html.replace(/{{\s*\[summary\.budget_used_pct,\s*100\]\s*\|\s*min\s*}}/, Math.min(summary.budget_used_pct, 100));

    return html;
  }

  return html;
}

// -------------------------------------------------------------
// Request Routing & Security Shield
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // Apply standard defensive security headers to all responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  let parsed;
  try {
    parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Bad Request');
  }

  const rawPathname = decodeURI(parsed.pathname || '/');
  const pathname = path.posix.normalize(rawPathname);
  const searchParams = parsed.searchParams;

  // 1. Strict blocking of sensitive files, hidden directories, environment configs, and path traversal threats
  const SENSITIVE_PATTERN = /(\.env|\.git|\.py|\.sqlite|\.db|\.json|\.sh|\.bak|\.config|\.yml|\.yaml|\.key|\.pem|\.cert|\.secret|\.\.)/i;
  if (
    SENSITIVE_PATTERN.test(pathname) ||
    SENSITIVE_PATTERN.test(rawPathname) ||
    pathname.includes('\0') ||
    pathname.includes('%00') ||
    rawPathname.toLowerCase().includes('.env')
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  // 2. Hardened Static Assets Serving
  if (pathname.startsWith('/static/')) {
    const staticDir = path.resolve(ROOT, 'static');
    const rel = pathname.slice('/static/'.length);
    const resolvedPath = path.resolve(staticDir, rel);

    // Guard against path traversal out of the static directory
    if (!resolvedPath.startsWith(staticDir + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Access Denied');
    }

    const baseName = path.basename(resolvedPath);
    if (baseName.startsWith('.')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Access Denied');
    }

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const allowedMimes = {
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2'
      };

      if (!allowedMimes[ext]) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Access Denied');
      }

      res.writeHead(200, { 'Content-Type': allowedMimes[ext] });
      return fs.createReadStream(resolvedPath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Static file not found');
  }

  // GET Pages
  if (req.method === 'GET') {
    const store = readData();

    if (pathname === '/') {
      const html = renderTemplate('index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (pathname === '/dashboard') {
      const summary = computeSummary(store);
      const recent_income = [...store.income].reverse().slice(0, 5);
      const recent_expenses = [...store.expenses].reverse().slice(0, 5);
      const html = renderTemplate('dashboard.html', { summary, recent_income, recent_expenses });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (pathname === '/income') {
      const error = searchParams.get('error');
      const income_list = [...store.income].reverse();
      const total_income = income_list.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
      const html = renderTemplate('income.html', { income_list, total_income, error });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (pathname === '/expenses') {
      const error = searchParams.get('error');
      const expense_list = [...store.expenses].reverse();
      const total_expenses = expense_list.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const html = renderTemplate('expenses.html', { expense_list, total_expenses, categories: EXPENSE_CATEGORIES, error });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (pathname === '/budget') {
      const error = searchParams.get('error');
      const summary = computeSummary(store);
      const html = renderTemplate('budget.html', { summary, error });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (pathname === '/recommendations') {
      const html = renderTemplate('recommendations.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
  }

  // Parse Body for Form and API Posts
  let rawBody = '';
  req.on('data', chunk => rawBody += chunk);
  req.on('end', async () => {
    // API: Recommendations (POST)
    if (pathname === '/api/recommendations' && req.method === 'POST') {
      const store = readData();
      const summary = computeSummary(store);
      const result = await callGemini({
        total_income: summary.total_income,
        total_expenses: summary.total_expenses,
        monthly_budget: summary.budget,
        remaining_balance: summary.remaining_balance,
        category_summary: summary.category_summary
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(result));
    }

    // Form POSTs
    const params = new URLSearchParams(rawBody);

    if (pathname === '/income/add' && req.method === 'POST') {
      const source = (params.get('source') || '').trim();
      const amountRaw = params.get('amount');
      const date = params.get('date');
      const description = (params.get('description') || '').trim();

      if (!source) {
        res.writeHead(303, { Location: '/income?error=' + encodeURIComponent('Source is required.') });
        return res.end();
      }

      const amount = parseFloat(amountRaw);
      if (isNaN(amount) || amount <= 0) {
        res.writeHead(303, { Location: '/income?error=' + encodeURIComponent('Income amount must be greater than zero.') });
        return res.end();
      }

      const store = readData();
      const newId = store.income.length > 0 ? Math.max(...store.income.map(i => i.id)) + 1 : 1;
      store.income.push({
        id: newId,
        source,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        description: description || null
      });
      writeData(store);

      res.writeHead(303, { Location: '/income' });
      return res.end();
    }

    if (pathname.startsWith('/income/delete/') && req.method === 'POST') {
      const id = parseInt(pathname.replace('/income/delete/', ''), 10);
      const store = readData();
      store.income = store.income.filter(i => i.id !== id);
      writeData(store);
      res.writeHead(303, { Location: '/income' });
      return res.end();
    }

    if (pathname === '/expenses/add' && req.method === 'POST') {
      const category = (params.get('category') || '').trim();
      const amountRaw = params.get('amount');
      const date = params.get('date');
      const description = (params.get('description') || '').trim();

      if (!EXPENSE_CATEGORIES.includes(category)) {
        res.writeHead(303, { Location: '/expenses?error=' + encodeURIComponent('Invalid category selected.') });
        return res.end();
      }

      const amount = parseFloat(amountRaw);
      if (isNaN(amount) || amount <= 0) {
        res.writeHead(303, { Location: '/expenses?error=' + encodeURIComponent('Expense amount must be greater than zero.') });
        return res.end();
      }

      const store = readData();
      const newId = store.expenses.length > 0 ? Math.max(...store.expenses.map(e => e.id)) + 1 : 1;
      store.expenses.push({
        id: newId,
        category,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        description: description || null
      });
      writeData(store);

      res.writeHead(303, { Location: '/expenses' });
      return res.end();
    }

    if (pathname.startsWith('/expenses/delete/') && req.method === 'POST') {
      const id = parseInt(pathname.replace('/expenses/delete/', ''), 10);
      const store = readData();
      store.expenses = store.expenses.filter(e => e.id !== id);
      writeData(store);
      res.writeHead(303, { Location: '/expenses' });
      return res.end();
    }

    if (pathname === '/budget/update' && req.method === 'POST') {
      const budgetRaw = params.get('monthly_budget');
      const budget = parseFloat(budgetRaw);

      if (isNaN(budget) || budget < 0) {
        res.writeHead(303, { Location: '/budget?error=' + encodeURIComponent('Budget must be a valid, non-negative number.') });
        return res.end();
      }

      const store = readData();
      store.budget = budget;
      writeData(store);

      res.writeHead(303, { Location: '/budget' });
      return res.end();
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PocketSmart AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

module.exports = { server, callGemini, computeSummary, readData, writeData };
