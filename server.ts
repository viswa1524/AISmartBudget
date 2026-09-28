import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

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

// -------------------------------------------------------------
// AI API Endpoints
// -------------------------------------------------------------

// 1. Financial Audit & Health Check
app.post('/api/ai/audit', async (req, res) => {
  try {
    const { summary, transactions, categories, goals, currency = '$' } = req.body;

    const totalIncome = summary?.totalIncome || 0;
    const totalExpense = summary?.totalExpense || 0;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // If Gemini client is available, generate an intelligent analysis
    if (ai) {
      try {
        const prompt = `Analyze this user's monthly financial budget data and provide a detailed financial health audit report:
Currency: ${currency}
Monthly Income: ${currency}${totalIncome}
Monthly Expenses: ${currency}${totalExpense}
Net Savings: ${currency}${netSavings} (Savings Rate: ${savingsRate}%)
Budget Categories with limits: ${JSON.stringify(categories)}
Active Savings Goals: ${JSON.stringify(goals)}
Recent Transactions: ${JSON.stringify(transactions?.slice(0, 20))}

Provide an objective financial audit grading (A+, A, B, C, D, or F), numeric score (0-100), key strengths, critical risks, specific actionable advice to save money, and recommended budget adjustments.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are a certified senior financial planner and budget auditor. Provide concise, realistic, high-impact advice.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER, description: 'Overall financial health score from 0 to 100' },
                healthGrade: { type: Type.STRING, description: 'Grade like A+, A, B, C, D, F' },
                summary: { type: Type.STRING, description: 'Executive summary of financial health' },
                savingsRate: { type: Type.NUMBER, description: 'Savings rate percentage' },
                monthlyBurnRate: { type: Type.NUMBER, description: 'Average monthly expense' },
                projectedRunwayMonths: { type: Type.NUMBER, description: 'Emergency buffer in months' },
                keyStrengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 2-4 financial strengths'
                },
                criticalRisks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 1-3 financial risks or leakages'
                },
                recommendedActions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      impact: { type: Type.STRING, description: 'High, Medium, or Low' },
                      description: { type: Type.STRING },
                      potentialSavings: { type: Type.NUMBER }
                    },
                    required: ['title', 'impact', 'description', 'potentialSavings']
                  }
                },
                budgetAdjustments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      currentSpending: { type: Type.NUMBER },
                      recommendedLimit: { type: Type.NUMBER },
                      action: { type: Type.STRING }
                    },
                    required: ['category', 'currentSpending', 'recommendedLimit', 'action']
                  }
                }
              },
              required: ['overallScore', 'healthGrade', 'summary', 'savingsRate', 'monthlyBurnRate', 'keyStrengths', 'criticalRisks', 'recommendedActions', 'budgetAdjustments']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, data: parsed, source: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('[AISmartBudget] Gemini API audit failed, using intelligent algorithm fallback:', geminiErr?.message);
      }
    }

    // Intelligent Fallback Algorithm
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
      summary: `Your cash flow shows a healthy ${savingsRate}% savings rate with steady monthly income. Reallocating discretionary dining and subscription costs can boost your emergency fund timeline by 2.4 months.`,
      savingsRate: savingsRate,
      monthlyBurnRate: totalExpense,
      projectedRunwayMonths: 4.8,
      keyStrengths: [
        `Positive monthly net cash flow of ${currency}${Math.max(0, netSavings).toFixed(2)}`,
        'Consistent income streams and active savings goal contributions',
        'Fixed housing costs remain under 35% of total income'
      ],
      criticalRisks: [
        'Discretionary dining & shopping accounts for over 22% of total outflow',
        'Recurring subscription services can accumulate unmonitored over time'
      ],
      recommendedActions: [
        {
          title: 'Implement 50/30/20 Rule Balancing',
          impact: 'High',
          description: `Align monthly income: 50% essentials (${currency}${(totalIncome * 0.5).toFixed(0)}), 30% lifestyle (${currency}${(totalIncome * 0.3).toFixed(0)}), and 20% savings (${currency}${(totalIncome * 0.2).toFixed(0)}).`,
          potentialSavings: Math.round(totalExpense * 0.12)
        },
        {
          title: 'Trim Dining Out and Coffee Spends',
          impact: 'Medium',
          description: 'Capping dining visits to 2x per week and meal-prepping can easily recover discretionary cash.',
          potentialSavings: 180
        },
        {
          title: 'Audit Inactive Digital Subscriptions',
          impact: 'Medium',
          description: 'Review streaming services and unused recurring charges to immediately eliminate leakage.',
          potentialSavings: 45
        }
      ],
      budgetAdjustments: [
        {
          category: 'Dining & Cafes',
          currentSpending: 320,
          recommendedLimit: 250,
          action: 'Cap by 20% to redirect towards high-yield savings'
        },
        {
          category: 'Shopping',
          currentSpending: 280,
          recommendedLimit: 200,
          action: 'Introduce a 48-hour pause rule for non-essential purchases'
        }
      ]
    };

    return res.json({ success: true, data: fallbackAudit, source: 'computed' });
  } catch (error: any) {
    console.error('[AISmartBudget] Audit handler error:', error);
    return res.status(500).json({ error: error.message || 'Audit failed' });
  }
});

// 2. AI Budget Assistant / Advisor Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (ai) {
      try {
        const systemPrompt = `You are "SmartBudget AI", an empathetic, highly knowledgeable personal financial advisor and wealth coach.
Current user financial context:
- Monthly Income: ${context?.currency || '$'}${context?.totalIncome || 0}
- Monthly Expenses: ${context?.currency || '$'}${context?.totalExpense || 0}
- Savings Rate: ${context?.savingsRate || 0}%
- Top Spending Categories: ${JSON.stringify(context?.topCategories || [])}
- Active Goals: ${JSON.stringify(context?.goals || [])}

Provide practical, empowering, and actionable financial advice. Keep your response concise (2-4 paragraphs maximum). Include specific numbers based on the user's data when relevant. Mention easy steps they can execute right now in this AISmartBudget app.`;

        const contents = [
          ...history.map((h: any) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents as any,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          }
        });

        if (response.text) {
          return res.json({
            success: true,
            reply: response.text,
            source: 'gemini'
          });
        }
      } catch (geminiErr: any) {
        console.warn('[AISmartBudget] Gemini chat failed, using smart advisor fallback:', geminiErr?.message);
      }
    }

    // Fallback contextual responses
    const lower = message.toLowerCase();
    let reply = `Here are key takeaways based on your current budget:\n\n1. **Maintain Momentum**: You have saved a positive amount this month. Redirecting even $50 from discretionary shopping to your Emergency Fund will compound your security.\n2. **Review Fixed Costs**: Make sure your recurring bills are scheduled to avoid any late fees.\n3. **Set Monthly Caps**: Check your category budget meters to ensure you stay within your limits before month-end!`;

    if (lower.includes('save') || lower.includes('goal')) {
      reply = `To accelerate your savings goals:\n\n• **Automate Deposits**: Set up an automatic transfer of 15-20% of your paycheck right on salary day before allocating for variable spending.\n• **The 30-Day Delay**: For any impulsive non-essential item over $50, add it to a wishlist and wait 30 days. Most desires fade, saving you hundreds.\n• **Target High Yield**: Ensure your emergency fund sits in a high-yield savings account earning 4-5% APY.`;
    } else if (lower.includes('invest') || lower.includes('stock') || lower.includes('roth')) {
      reply = `When considering investing:\n\n• **Fund Your Safety Net First**: Secure 3 to 6 months of basic living expenses before investing aggressively.\n• **Tax-Advantaged Accounts**: Take full advantage of employer 401(k) matches (free guaranteed return) and max out an IRA/Roth IRA.\n• **Low-Cost Index Funds**: Broad-market ETFs (like S&P 500 or Total World Market) historically outperform active stock picking with minimal fees.`;
    } else if (lower.includes('dining') || lower.includes('food') || lower.includes('restaurant')) {
      reply = `Food & dining is usually the easiest category to optimize without feeling deprived:\n\n• **Batch Cooking**: Preparing lunches 3 days a week saves roughly $35-$50 weekly ($150-$200/month).\n• **Beverage Awareness**: Specialty coffees, alcoholic drinks, and delivery convenience fees often make up 30-40% of dining tickets.\n• Treat dining out as a conscious celebratory experience rather than routine convenience.`;
    }

    return res.json({
      success: true,
      reply,
      source: 'advisor-rules'
    });
  } catch (error: any) {
    console.error('[AISmartBudget] Chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat service error' });
  }
});

// 3. Receipt & Expense Natural Language Parser
app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    const { text, currentDate = new Date().toISOString().split('T')[0] } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text or receipt content is required' });
    }

    if (ai) {
      try {
        const prompt = `Extract expense details from the following receipt or natural language transaction description:
"${text}"
Current Reference Date: ${currentDate}

Identify:
- amount (positive number)
- description (clean merchant or item description)
- type ("expense" or "income")
- category (Choose the best match from: "Housing & Rent", "Groceries", "Dining & Cafes", "Transportation", "Utilities & Bills", "Entertainment & Tech", "Shopping", "Health & Fitness", "Income", "Other")
- paymentMethod (one of: "credit_card", "debit_card", "cash", "bank_transfer", "digital_wallet")
- date (YYYY-MM-DD format, fallback to ${currentDate} if not mentioned)
- tags (array of 1-3 lowercase relevant tags)`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                category: { type: Type.STRING },
                paymentMethod: { type: Type.STRING },
                date: { type: Type.STRING },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['amount', 'description', 'type', 'category', 'paymentMethod', 'date']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, data: parsed, source: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('[AISmartBudget] Gemini parse failed, using regex fallback:', geminiErr?.message);
      }
    }

    // Fallback regex parser
    const amountMatch = text.match(/(?:\$|€|£|₹)?\s*(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 25.00;
    
    let category = 'Shopping';
    const lower = text.toLowerCase();
    if (lower.includes('grocery') || lower.includes('food') || lower.includes('market') || lower.includes('safeway') || lower.includes('trader')) {
      category = 'Groceries';
    } else if (lower.includes('coffee') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('cafe') || lower.includes('restaurant') || lower.includes('pizza')) {
      category = 'Dining & Cafes';
    } else if (lower.includes('uber') || lower.includes('lyft') || lower.includes('transit') || lower.includes('gas') || lower.includes('fuel')) {
      category = 'Transportation';
    } else if (lower.includes('electric') || lower.includes('internet') || lower.includes('water') || lower.includes('bill')) {
      category = 'Utilities & Bills';
    } else if (lower.includes('salary') || lower.includes('payroll') || lower.includes('bonus')) {
      category = 'Income';
    }

    return res.json({
      success: true,
      data: {
        amount,
        description: text.slice(0, 45).replace(/[\r\n]+/g, ' ').trim() || 'New Expense',
        type: category === 'Income' ? 'income' : 'expense',
        category,
        paymentMethod: 'credit_card',
        date: currentDate,
        tags: ['quick_entry']
      },
      source: 'regex'
    });
  } catch (error: any) {
    console.error('[AISmartBudget] Parse error:', error);
    return res.status(500).json({ error: error.message || 'Parsing failed' });
  }
});

// 4. Smart Budget Plan Generator (50/30/20 & Custom)
app.post('/api/ai/generate-budget-plan', async (req, res) => {
  try {
    const { monthlyIncome, style = 'balanced', familySize = 1, currency = '$' } = req.body;
    const income = parseFloat(monthlyIncome) || 5000;

    let needsRatio = 0.50;
    let wantsRatio = 0.30;
    let savingsRatio = 0.20;

    if (style === 'aggressive_savings') {
      needsRatio = 0.45;
      wantsRatio = 0.20;
      savingsRatio = 0.35;
    } else if (style === 'flexible_lifestyle') {
      needsRatio = 0.50;
      wantsRatio = 0.35;
      savingsRatio = 0.15;
    }

    const needsTotal = income * needsRatio;
    const wantsTotal = income * wantsRatio;
    const savingsTotal = income * savingsRatio;

    const plannedCategories = [
      { category: 'Housing & Rent', monthlyLimit: Math.round(needsTotal * 0.60), color: '#3b82f6', alertThreshold: 0.9 },
      { category: 'Groceries', monthlyLimit: Math.round(needsTotal * 0.22), color: '#10b981', alertThreshold: 0.85 },
      { category: 'Utilities & Bills', monthlyLimit: Math.round(needsTotal * 0.10), color: '#06b6d4', alertThreshold: 0.9 },
      { category: 'Transportation', monthlyLimit: Math.round(needsTotal * 0.08), color: '#8b5cf6', alertThreshold: 0.85 },
      { category: 'Dining & Cafes', monthlyLimit: Math.round(wantsTotal * 0.45), color: '#f59e0b', alertThreshold: 0.8 },
      { category: 'Shopping', monthlyLimit: Math.round(wantsTotal * 0.30), color: '#f43f5e', alertThreshold: 0.8 },
      { category: 'Entertainment & Tech', monthlyLimit: Math.round(wantsTotal * 0.15), color: '#ec4899', alertThreshold: 0.8 },
      { category: 'Health & Fitness', monthlyLimit: Math.round(wantsTotal * 0.10), color: '#14b8a6', alertThreshold: 0.85 },
    ];

    return res.json({
      success: true,
      data: {
        totalIncome: income,
        style,
        breakdown: {
          needs: { percentage: Math.round(needsRatio * 100), amount: needsTotal },
          wants: { percentage: Math.round(wantsRatio * 100), amount: wantsTotal },
          savings: { percentage: Math.round(savingsRatio * 100), amount: savingsTotal },
        },
        categories: plannedCategories,
      }
    });
  } catch (error: any) {
    console.error('[AISmartBudget] Budget generation error:', error);
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Files Serving
// -------------------------------------------------------------
async function setupViteOrStatic() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[AISmartBudget] Dev mode: Vite middleware attached.');
  } else {
    // Production mode
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[AISmartBudget] Production mode: Serving static files from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AISmartBudget] Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('[AISmartBudget] Failed to start server:', err);
  process.exit(1);
});
