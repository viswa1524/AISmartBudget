import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[AISmartBudget] Gemini initialization warning:', err);
  }
}

// Database utility functions
const DB_FILE = path.resolve(__dirname, 'db.json');

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[AISmartBudget] Could not read database file, initializing fresh:', err);
  }
  return {
    transactions: [],
    categories: [],
    goals: [],
    bills: [],
    currency: 'USD',
    updatedAt: new Date().toISOString()
  };
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AISmartBudget] Failed to write database file:', err);
  }
}

// ============= AI API ENDPOINTS =============

// 1. Financial Audit & Health Check
app.post('/api/ai/audit', async (req, res) => {
  try {
    const { summary, transactions, categories, goals, currency = '$' } = req.body;

    const totalIncome = summary?.totalIncome || 0;
    const totalExpense = summary?.totalExpense || 0;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    if (ai) {
      try {
        const prompt = `Analyze this user's monthly money numbers and draft a financial review in VERY SIMPLE, EVERYDAY WORDS:
Currency: ${currency}
Monthly Income: ${currency}${totalIncome}
Monthly Expenses: ${currency}${totalExpense}
Savings: ${currency}${netSavings} (${savingsRate}% savings rate)
Categories: ${JSON.stringify(categories)}
Goals: ${JSON.stringify(goals)}
Transactions: ${JSON.stringify(transactions?.slice(0, 20))}

Provide a grade (A+, A, B, C, D, F), score 0-100, 2-3 strengths, 1-2 risks, and 3 actionable tips.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are a warm, helpful personal money coach using simple, plain language.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER },
                healthGrade: { type: Type.STRING },
                summary: { type: Type.STRING },
                savingsRate: { type: Type.NUMBER },
                monthlyBurnRate: { type: Type.NUMBER },
                keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                criticalRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedActions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      description: { type: Type.STRING },
                      potentialSavings: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, data: parsed, source: 'gemini' });
        }
      } catch (geminiErr) {
        console.warn('[AISmartBudget] Gemini audit failed:', geminiErr?.message);
      }
    }

    // Fallback if no Gemini
    let score = 50;
    if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate > 0) score += 5;
    else score -= 20;

    let grade = 'B';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';
    else grade = 'F';

    const fallbackAudit = {
      overallScore: Math.min(Math.max(score, 15), 98),
      healthGrade: grade,
      summary: `You earned ${currency}${totalIncome.toLocaleString()} and spent ${currency}${totalExpense.toLocaleString()}, leaving ${currency}${Math.max(0, netSavings).toLocaleString()}.`,
      savingsRate: savingsRate,
      monthlyBurnRate: totalExpense,
      keyStrengths: [
        `You have ${currency}${Math.max(0, netSavings).toLocaleString()} left over each month.`,
        'You track your spending and have clear goals.',
        'Your essential costs are within a safe range.'
      ],
      criticalRisks: [
        'Dining and shopping take up a large portion of spending.',
        'Monthly subscriptions can add up if not reviewed.'
      ],
      recommendedActions: [
        {
          title: 'Use 50/30/20 Budget Rule',
          impact: 'High',
          description: `Split income: 50% needs (${currency}${(totalIncome * 0.5).toFixed(0)}), 30% wants (${currency}${(totalIncome * 0.3).toFixed(0)}), 20% savings`,
          potentialSavings: Math.round(totalExpense * 0.12)
        },
        {
          title: 'Cook at Home More',
          impact: 'Medium',
          description: 'Eat out 2 fewer times per week',
          potentialSavings: 180
        },
        {
          title: 'Cancel Unused Subscriptions',
          impact: 'Medium',
          description: 'Review and remove unused services',
          potentialSavings: 45
        }
      ]
    };

    return res.json({ success: true, data: fallbackAudit, source: 'computed' });
  } catch (error) {
    console.error('[AISmartBudget] Audit error:', error);
    return res.status(500).json({ error: error.message || 'Audit failed' });
  }
});

// 2. AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    if (ai) {
      try {
        const systemPrompt = `You are SmartBudget AI, a helpful financial advisor.
Income: ${context?.currency || '$'}${context?.totalIncome || 0}
Expenses: ${context?.currency || '$'}${context?.totalExpense || 0}
Savings Rate: ${context?.savingsRate || 0}%
Provide practical advice in 2-4 paragraphs.`;

        const contents = [
          ...history.map((h) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: { systemInstruction: systemPrompt }
        });

        if (response.text) {
          return res.json({ success: true, reply: response.text, source: 'gemini' });
        }
      } catch (geminiErr) {
        console.warn('[AISmartBudget] Gemini chat failed:', geminiErr?.message);
      }
    }

    // Fallback responses
    let reply = 'Here are your financial highlights based on your current budget.';
    if (message.toLowerCase().includes('save')) {
      reply = 'To save more: automate 15-20% of income on payday, cook at home more, and review subscriptions.';
    } else if (message.toLowerCase().includes('invest')) {
      reply = 'Build a 3-6 month emergency fund first, then consider tax-advantaged accounts.';
    }

    return res.json({ success: true, reply, source: 'fallback' });
  } catch (error) {
    console.error('[AISmartBudget] Chat error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Parse expense
app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    const { text, currentDate = new Date().toISOString().split('T')[0] } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    // Simple regex fallback parser
    const amountMatch = text.match(/(?:\$|€|£|₹)?\s*(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 25.0;

    let category = 'Shopping';
    const lower = text.toLowerCase();
    if (lower.includes('grocery') || lower.includes('food') || lower.includes('market')) {
      category = 'Groceries';
    } else if (lower.includes('coffee') || lower.includes('dinner') || lower.includes('restaurant')) {
      category = 'Dining & Cafes';
    } else if (lower.includes('uber') || lower.includes('gas') || lower.includes('transit')) {
      category = 'Transportation';
    } else if (lower.includes('bill') || lower.includes('utility')) {
      category = 'Utilities & Bills';
    }

    return res.json({
      success: true,
      data: {
        amount,
        description: text.slice(0, 45).trim(),
        type: 'expense',
        category,
        paymentMethod: 'credit_card',
        date: currentDate,
        tags: ['parsed']
      },
      source: 'regex'
    });
  } catch (error) {
    console.error('[AISmartBudget] Parse error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Generate budget plan
app.post('/api/ai/generate-budget-plan', async (req, res) => {
  try {
    const { monthlyIncome, style = 'balanced' } = req.body;
    const income = parseFloat(monthlyIncome) || 5000;

    let needsRatio = 0.5;
    let wantsRatio = 0.3;
    let savingsRatio = 0.2;

    if (style === 'aggressive_savings') {
      needsRatio = 0.45;
      wantsRatio = 0.2;
      savingsRatio = 0.35;
    }

    const needsTotal = income * needsRatio;
    const wantsTotal = income * wantsRatio;
    const savingsTotal = income * savingsRatio;

    return res.json({
      success: true,
      data: {
        totalIncome: income,
        style,
        breakdown: {
          needs: { percentage: Math.round(needsRatio * 100), amount: needsTotal },
          wants: { percentage: Math.round(wantsRatio * 100), amount: wantsTotal },
          savings: { percentage: Math.round(savingsRatio * 100), amount: savingsTotal }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ============= DATABASE ENDPOINTS =============

app.get('/api/health', (_req, res) => {
  const db = loadDatabase();
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    aiConfigured: !!ai,
    database: {
      transactionsCount: db.transactions.length,
      categoriesCount: db.categories.length,
      goalsCount: db.goals.length
    }
  });
});

app.get('/api/data', (_req, res) => {
  try {
    const db = loadDatabase();
    res.json({ success: true, data: db });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const { transactions, categories, goals, bills, currency } = req.body;
    const currentDb = loadDatabase();
    const updatedDb = {
      transactions: Array.isArray(transactions) ? transactions : currentDb.transactions,
      categories: Array.isArray(categories) ? categories : currentDb.categories,
      goals: Array.isArray(goals) ? goals : currentDb.goals,
      bills: Array.isArray(bills) ? bills : currentDb.bills,
      currency: currency || currentDb.currency,
      updatedAt: new Date().toISOString()
    };
    saveDatabase(updatedDb);
    res.json({ success: true, message: 'Data saved', updatedAt: updatedDb.updatedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const { transaction } = req.body;
    if (!transaction || !transaction.amount) {
      return res.status(400).json({ error: 'Valid transaction required' });
    }
    const db = loadDatabase();
    const newTx = {
      ...transaction,
      id: transaction.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    db.transactions.unshift(newTx);
    db.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ success: true, transaction: newTx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDatabase();
    const initial = db.transactions.length;
    db.transactions = db.transactions.filter((t) => t.id !== id);
    db.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ success: true, deletedId: id, count: initial - db.transactions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset-data', (_req, res) => {
  try {
    const emptyDb = {
      transactions: [],
      categories: [],
      goals: [],
      bills: [],
      currency: 'USD',
      updatedAt: new Date().toISOString()
    };
    saveDatabase(emptyDb);
    res.json({ success: true, message: 'Database reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AISmartBudget] Server running on http://0.0.0.0:${PORT}`);
});
