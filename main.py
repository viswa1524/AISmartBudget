import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from google import genai
import uvicorn

load_dotenv()
app = FastAPI(title="FastAPI Gemini Budget Planner")
templates = Jinja2Templates(directory="templates")
client = genai.Client()

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/plan")
def plan(request: Request, budget: int = Form(...), goal: str = Form(...)):
    r = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=f"Split a budget of {budget} for {goal}"
    )
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={"result": r.text, "budget": budget, "goal": goal}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
