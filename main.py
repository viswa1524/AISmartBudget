import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from google import genai
import uvicorn

load_dotenv()

app = FastAPI(title="AISmartBudget - AI Powered Budget Manager")

# Mount static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="public"), name="static")

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.get("/")
async def root():
    """Serve the main HTML file"""
    return FileResponse("public/index.html")

@app.post("/api/ai/analyze")
async def analyze_budget(request: Request):
    """Analyze budget using Gemini AI"""
    try:
        data = await request.json()
        income = data.get("income", 0)
        expense = data.get("expense", 0)
        transactions = data.get("transactions", [])
        
        prompt = f"""
        Analyze this financial data and provide insights:
        Monthly Income: ${income}
        Monthly Expenses: ${expense}
        Savings: ${income - expense}
        
        Recent Transactions: {transactions}
        
        Provide a brief financial health assessment with actionable recommendations.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        return {"success": True, "analysis": response.text}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/ai/chat")
async def chat_assistant(request: Request):
    """Chat with AI financial assistant"""
    try:
        data = await request.json()
        message = data.get("message", "")
        context = data.get("context", {})
        
        system_prompt = f"""
        You are SmartBudget AI, a helpful financial advisor.
        Current financial context:
        - Monthly Income: ${context.get('income', 0)}
        - Monthly Expenses: ${context.get('expense', 0)}
        - Savings Rate: {context.get('savingsRate', 0)}%
        
        Provide helpful, practical financial advice in a friendly tone.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=message,
            system_instruction=system_prompt
        )
        
        return {"success": True, "reply": response.text}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/ai/parse-receipt")
async def parse_receipt(request: Request):
    """Parse receipt text using AI"""
    try:
        data = await request.json()
        receipt_text = data.get("text", "")
        
        prompt = f"""
        Parse this receipt or expense text and extract:
        - Amount (number only)
        - Description (merchant/item)
        - Category (Groceries, Dining, Transportation, etc.)
        - Date (if mentioned)
        
        Receipt text: {receipt_text}
        
        Return as JSON with keys: amount, description, category, date
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        return {"success": True, "parsed": response.text}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/ai/budget-advice")
async def get_budget_advice(request: Request):
    """Get personalized budget advice"""
    try:
        data = await request.json()
        budget_data = data.get("budget", {})
        
        prompt = f"""
        Based on this budget breakdown, provide 3 specific, actionable recommendations:
        {budget_data}
        
        Focus on practical ways to improve savings and financial health.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        return {"success": True, "advice": response.text}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
