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
        const prompt = `Analyze this user's monthly money numbers and draft a financial review in VERY SIMPLE, EVERYDAY WORDS that any person or client can easily understand:
Currency: ${currency}
Monthly Money In (Income): ${currency}${totalIncome}
Monthly Money Out (Expenses): ${currency}${totalExpense}
Money Left Over (Savings): ${currency}${netSavings} (Saving ${savingsRate}% of earnings)
Budget Categories with limits: ${JSON.stringify(categories)}
Active Savings Goals: ${JSON.stringify(goals)}
Recent Transactions: ${JSON.stringify(transactions?.slice(0, 20))}

IMPORTANT WRITING STYLE RULES:
1. Use SIMPLE, EVERYDAY WORDS only. Avoid heavy financial jargon, Wall Street buzzwords, or complicated corporate terms.
2. Instead of "discretionary outflow optimization", write "Cook at home more & cut down eating out".
3. Instead of "contingency runway buffer", write "Rainy-day emergency fund".
4. Instead of "expenditure variance", write "Where your money went".
5. Keep explanations short, friendly, direct, and encouraging.
6. Provide an easy letter grade (A+, A, B, C, D, or F), a score out of 100, 2-3 positive things done well, 1-2 easy things to watch out for, and 3 clear, practical tips to save more money each month.`;

        let responseText: string | null = null;
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are a warm, helpful personal money coach. Always explain financial concepts using simple, plain, conversational words that anyone can instantly understand and act upon without confusion.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  overallScore: { type: Type.NUMBER, description: 'Overall money score from 0 to 100' },
                  healthGrade: { type: Type.STRING, description: 'Simple grade like A+, A, B, C, D, F' },
                  summary: { type: Type.STRING, description: 'Executive summary written in simple, plain, friendly language' },
                  savingsRate: { type: Type.NUMBER, description: 'Percentage of money saved' },
                  monthlyBurnRate: { type: Type.NUMBER, description: 'Total money spent each month' },
                  projectedRunwayMonths: { type: Type.NUMBER, description: 'How many months rainy day fund will last' },
                  keyStrengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2-4 simple, encouraging things the user is doing right'
                  },
                  criticalRisks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1-3 simple money leaks or things to watch out for in plain words'
                  },
                  recommendedActions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: 'Short, simple action title in everyday words' },
                        impact: { type: Type.STRING, description: 'High, Medium, or Low' },
                        description: { type: Type.STRING, description: 'Simple explanation of how to do it' },
                        potentialSavings: { type: Type.NUMBER, description: 'Estimated dollars saved per month' }
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
                        action: { type: Type.STRING, description: 'Simple suggestion for this category' }
                      },
                      required: ['category', 'currentSpending', 'recommendedLimit', 'action']
                    }
                  }
                },
                required: ['overallScore', 'healthGrade', 'summary', 'savingsRate', 'monthlyBurnRate', 'keyStrengths', 'criticalRisks', 'recommendedActions', 'budgetAdjustments']
              }
            }
          });
          if (response?.text) responseText = response.text;
        } catch (callErr: any) {
          console.warn('[AISmartBudget] Primary gemini-2.5-flash call hit limit or error, using smart fallback:', callErr?.message);
        }

        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json({ success: true, data: parsed, report: parsed, source: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('[AISmartBudget] Gemini API audit failed, using intelligent algorithm fallback:', geminiErr?.message);
      }
    }

    // Intelligent Fallback Algorithm (Drafted in Simple Words)
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
      summary: `Here is your simple money summary: You brought in ${currency}${totalIncome.toLocaleString()} and spent ${currency}${totalExpense.toLocaleString()}, leaving ${currency}${Math.max(0, netSavings).toLocaleString()} in your pocket (${savingsRate}% saved). You are making good progress, and cutting down on a few casual expenses can help you reach your goals even faster.`,
      savingsRate: savingsRate,
      monthlyBurnRate: totalExpense,
      projectedRunwayMonths: 4.8,
      keyStrengths: [
        `You have ${currency}${Math.max(0, netSavings).toLocaleString()} left over every month after all bills are paid.`,
        'You have clear savings goals and keep track of where money goes.',
        'Your big essential living costs remain well within a safe range.'
      ],
      criticalRisks: [
        'Eating out and casual shopping take up a large slice of your monthly spending.',
        'Monthly subscriptions can quietly add up if not checked regularly.'
      ],
      recommendedActions: [
        {
          title: 'Try the 50/30/20 Simple Budget Rule',
          impact: 'High',
          description: `Aim to split your take-home pay: 50% for needs (${currency}${(totalIncome * 0.5).toFixed(0)}), 30% for fun & lifestyle (${currency}${(totalIncome * 0.3).toFixed(0)}), and 20% straight into savings (${currency}${(totalIncome * 0.2).toFixed(0)}).`,
          potentialSavings: Math.round(totalExpense * 0.12)
        },
        {
          title: 'Cook at Home a Few More Days a Week',
          impact: 'Medium',
          description: 'Eating out or grabbing takeaway just 2 fewer times a week puts easy money right back in your bank account.',
          potentialSavings: 180
        },
        {
          title: 'Cancel Any Subscriptions You Do Not Use',
          impact: 'Medium',
          description: 'Check your recurring apps and streaming services. Cancelling 1 or 2 unused plans is instant free savings.',
          potentialSavings: 45
        }
      ],
      budgetAdjustments: [
        {
          category: 'Dining & Cafes',
          currentSpending: 320,
          recommendedLimit: 250,
          action: 'Cook at home more often to save cash'
        },
        {
          category: 'Shopping',
          currentSpending: 280,
          recommendedLimit: 200,
          action: 'Wait 2 days before buying items you do not urgently need'
        }
      ]
    };

    return res.json({ success: true, data: fallbackAudit, report: fallbackAudit, source: 'computed' });
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
          model: 'gemini-2.5-flash',
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
          model: 'gemini-2.5-flash',
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

// 5. Omni-Input Single Input Gemini Assistant
app.post('/api/ai/omni', async (req, res) => {
  try {
    const { input, context } = req.body;
    if (!input || !input.trim()) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const trimmedInput = input.trim();
    const currency = context?.currency || '$';
    const currentDate = new Date().toISOString().split('T')[0];

    if (ai) {
      try {
        const prompt = `You are the central AI financial assistant for AISmartBudget. The user gave this single command or question:
"${trimmedInput}"

User financial snapshot:
- Currency: ${currency}
- Total Income: ${currency}${context?.totalIncome || 0}
- Total Expense: ${currency}${context?.totalExpense || 0}
- Net Savings: ${currency}${context?.netSavings || 0}
- Existing Categories: ${JSON.stringify(context?.categories?.map((c: any) => c.category) || [])}
- Active Goals: ${JSON.stringify(context?.goals?.map((g: any) => g.title) || [])}
- Recent Transactions: ${JSON.stringify(context?.transactions?.slice(0, 10) || [])}
- Current Date: ${currentDate}

Decide what the user intends to do:
1. "add_transaction": if the user describes spending money or receiving income (e.g., "spent $45 on groceries", "bought coffee for $6", "received 2500 salary").
   Extract: amount (number), description (clean concise merchant or title), type ("expense" | "income"), category (match existing or best fit), paymentMethod (credit_card | debit_card | cash | bank_transfer | digital_wallet), date (${currentDate}), tags (array of strings).
2. "set_budget": if the user requests adjusting or setting a category spending limit (e.g., "set dining budget to $300").
   Extract: category (string), monthlyLimit (number).
3. "create_goal": if the user wants to start or fund a savings target (e.g., "save 2000 for vacation by August").
   Extract: title (string), targetAmount (number), deadline (YYYY-MM-DD or default in 6 months), category (string).
4. "answer": for questions or advice.

CRITICAL INSTRUCTION - MINIMALIST OUTPUT:
Keep the message strictly minimal, concise, and focused only on essential data.
- For transactions: e.g. "Recorded ${currency}[amount] for [description] ([category])"
- For budgets: e.g. "[category] monthly budget updated to ${currency}[limit]"
- For answers: Provide the direct key figures/facts in 1-2 brief sentences without conversational filler, intros, or pleasantries.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                intent: { 
                  type: Type.STRING, 
                  description: 'One of: add_transaction, set_budget, create_goal, answer' 
                },
                message: { 
                  type: Type.STRING, 
                  description: 'Strictly minimal, concise message with only important details' 
                },
                transactionData: {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    category: { type: Type.STRING },
                    paymentMethod: { type: Type.STRING },
                    date: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                budgetData: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    monthlyLimit: { type: Type.NUMBER }
                  }
                },
                goalData: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    targetAmount: { type: Type.NUMBER },
                    deadline: { type: Type.STRING },
                    category: { type: Type.STRING }
                  }
                }
              },
              required: ['intent', 'message']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, data: parsed, source: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('[AISmartBudget] Gemini Omni failed, falling back to rule engine:', geminiErr?.message);
      }
    }

    // Rule-based fallback parser
    const lower = trimmedInput.toLowerCase();
    const amountMatch = trimmedInput.match(/(?:\$|€|£|₹)?\s*(\d+(?:\.\d{1,2})?)/);
    const parsedAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Check if adding transaction
    if (parsedAmount > 0 && (lower.includes('spent') || lower.includes('paid') || lower.includes('bought') || lower.includes('got') || lower.includes('earned') || lower.includes('cost') || lower.includes('for') || lower.includes('at'))) {
      const isIncome = lower.includes('got') || lower.includes('salary') || lower.includes('earned') || lower.includes('payroll') || lower.includes('income');
      let cat = 'Shopping';
      if (lower.includes('grocer') || lower.includes('food') || lower.includes('supermarket') || lower.includes('market') || lower.includes('trader')) cat = 'Groceries';
      else if (lower.includes('coffee') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('cafe') || lower.includes('restaurant')) cat = 'Dining & Cafes';
      else if (lower.includes('uber') || lower.includes('lyft') || lower.includes('gas') || lower.includes('transit')) cat = 'Transportation';
      else if (lower.includes('rent') || lower.includes('apartment')) cat = 'Housing & Rent';
      else if (lower.includes('bill') || lower.includes('utility') || lower.includes('electric') || lower.includes('internet')) cat = 'Utilities & Bills';
      else if (isIncome) cat = 'Income';

      return res.json({
        success: true,
        data: {
          intent: 'add_transaction',
          message: `${isIncome ? '+' : '-'}${currency}${parsedAmount.toFixed(2)} • ${cat}`,
          transactionData: {
            amount: parsedAmount,
            description: trimmedInput.replace(/spent|paid|bought|for|\$|\d+(\.\d{1,2})?/gi, '').trim() || (isIncome ? 'Income Entry' : 'Expense Entry'),
            type: isIncome ? 'income' : 'expense',
            category: cat,
            paymentMethod: 'credit_card',
            date: currentDate,
            tags: ['omni_ai']
          }
        },
        source: 'rule_engine'
      });
    }

    // Default concise reply
    let reply = `Inflow: ${currency}${context?.totalIncome || 0} • Outflow: ${currency}${context?.totalExpense || 0} • Net: ${currency}${context?.netSavings || 0}`;
    if (lower.includes('save') || lower.includes('saving')) {
      reply = `Discretionary dining & shopping is your highest potential area for savings. Automating +$50/wk yields +$2,600/yr.`;
    } else if (lower.includes('how much') || lower.includes('spent') || lower.includes('balance')) {
      reply = `Total spent: ${currency}${context?.totalExpense || 0} • Net surplus: ${currency}${context?.netSavings || 0} (${context?.savingsRate || 0}% savings rate).`;
    }

    return res.json({
      success: true,
      data: {
        intent: 'answer',
        message: reply
      },
      source: 'rule_engine'
    });

  } catch (error: any) {
    console.error('[AISmartBudget] Omni error:', error);
    return res.status(500).json({ error: error.message || 'Omni failed' });
  }
});

// -------------------------------------------------------------
// FastAPI & Gemini Budget Splitter API Endpoint (matches main.py)
// -------------------------------------------------------------
app.post('/api/fastapi/plan', async (req, res) => {
  const { budget, goal } = req.body;
  const numBudget = Number(budget) || 1000;
  const goalStr = goal?.trim() || 'Living room renovation';

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Split a budget of ${numBudget} for ${goalStr}`
      });
      return res.json({
        success: true,
        budget: numBudget,
        goal: goalStr,
        result: response.text
      });
    } catch (err: any) {
      console.error('FastAPI Plan error:', err);
    }
  }

  // Rule-based fallback if offline/no key
  return res.json({
    success: true,
    budget: numBudget,
    goal: goalStr,
    result: `Actionable Budget Allocation for ${goalStr} ($${numBudget}):\n• Primary Materials & Hardware: $${(numBudget * 0.45).toFixed(0)} (45%)\n• Labor & Craftsmanship: $${(numBudget * 0.30).toFixed(0)} (30%)\n• Delivery & Auxiliary Costs: $${(numBudget * 0.10).toFixed(0)} (10%)\n• Emergency & Contingency Buffer: $${(numBudget * 0.15).toFixed(0)} (15%)`
  });
});

// -------------------------------------------------------------
// Persistent Database Layer (Server Storage & REST Endpoints)
// -------------------------------------------------------------
const DB_FILE = path.resolve(__dirname, 'db.json');

interface DatabaseSchema {
  transactions: any[];
  categories: any[];
  goals: any[];
  bills: any[];
  currency: string;
  updatedAt: string;
}

function loadDatabase(): DatabaseSchema {
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

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AISmartBudget] Failed to write database file:', err);
  }
}

// 1. Health check & status
app.get('/api/health', (_req, res) => {
  const db = loadDatabase();
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    aiConfigured: !!ai,
    timestamp: new Date().toISOString(),
    database: {
      transactionsCount: db.transactions.length,
      categoriesCount: db.categories.length,
      goalsCount: db.goals.length,
      billsCount: db.bills.length
    },
    endpoints: [
      'GET  /api/health',
      'GET  /api/data',
      'POST /api/data',
      'POST /api/transactions',
      'DELETE /api/transactions/:id',
      'POST /api/reset-data',
      'POST /api/ai/audit',
      'POST /api/ai/chat',
      'POST /api/ai/parse-expense',
      'POST /api/ai/generate-budget-plan',
      'POST /api/ai/omni'
    ]
  });
});

// 2. Get all persisted user data
app.get('/api/data', (_req, res) => {
  try {
    const db = loadDatabase();
    res.json({ success: true, data: db });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to read data' });
  }
});

// 3. Save / Sync entire user data state
app.post('/api/data', (req, res) => {
  try {
    const { transactions, categories, goals, bills, currency } = req.body;
    const currentDb = loadDatabase();
    const updatedDb: DatabaseSchema = {
      transactions: Array.isArray(transactions) ? transactions : currentDb.transactions,
      categories: Array.isArray(categories) ? categories : currentDb.categories,
      goals: Array.isArray(goals) ? goals : currentDb.goals,
      bills: Array.isArray(bills) ? bills : currentDb.bills,
      currency: currency || currentDb.currency,
      updatedAt: new Date().toISOString()
    };
    saveDatabase(updatedDb);
    res.json({ success: true, message: 'Data saved successfully', updatedAt: updatedDb.updatedAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save data' });
  }
});

// 4. Add a single transaction
app.post('/api/transactions', (req, res) => {
  try {
    const { transaction } = req.body;
    if (!transaction || !transaction.amount) {
      return res.status(400).json({ error: 'Valid transaction object is required' });
    }
    const db = loadDatabase();
    const newTx = {
      ...transaction,
      id: transaction.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    db.transactions.unshift(newTx);
    db.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ success: true, transaction: newTx, totalCount: db.transactions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add transaction' });
  }
});

// 5. Delete a transaction by ID
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDatabase();
    const initialLen = db.transactions.length;
    db.transactions = db.transactions.filter((t: any) => t.id !== id);
    db.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({
      success: true,
      deletedId: id,
      deletedCount: initialLen - db.transactions.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});

// 6. Reset database
app.post('/api/reset-data', (_req, res) => {
  try {
    const emptyDb: DatabaseSchema = {
      transactions: [],
      categories: [],
      goals: [],
      bills: [],
      currency: 'USD',
      updatedAt: new Date().toISOString()
    };
    saveDatabase(emptyDb);
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset database' });
  }
});

// -------------------------------------------------------------
// Live Code Format & Repository Exporter
// -------------------------------------------------------------
app.get('/api/code-files', (_req, res) => {
  try {
    const fileList = [
      'main.py',
      'templates/index.html',
      'requirements.txt',
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'server.ts',
      'index.html',
      'src/main.tsx',
      'src/App.tsx',
      'src/types.ts',
      'src/index.css',
      'src/data/initialData.ts',
      'src/utils/formatters.ts',
      'src/services/googleSheets.ts',
      'src/components/HomeTab.tsx',
      'src/components/DashboardTab.tsx',
      'src/components/TransactionsTab.tsx',
      'src/components/BudgetPlannerTab.tsx',
      'src/components/AnalyticsTab.tsx',
      'src/components/SavingsGoalsTab.tsx',
      'src/components/RecurringBillsTab.tsx',
      'src/components/AiAssistantTab.tsx',
      'src/components/Navbar.tsx',
      'src/components/TransactionModal.tsx',
      'src/components/SmartReceiptModal.tsx',
      'src/components/SmartBudgetModal.tsx',
      'src/components/CurrencyModal.tsx'
    ];

    const files = fileList.map((relPath) => {
      const fullPath = path.resolve(__dirname, relPath);
      let content = '';
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
      return {
        path: relPath,
        name: path.basename(relPath),
        ext: path.extname(relPath).replace('.', ''),
        lines: content.split('\n').length,
        size: Buffer.byteLength(content, 'utf8'),
        content
      };
    });

    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve code files' });
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
