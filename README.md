# AISmartBudget

AISmartBudget is now a lightweight HTML, CSS, JavaScript, and Python application. The TypeScript/React build is no longer required to run the product.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python main.py
```

Open http://localhost:8000.

The Python FastAPI server serves the frontend, persists transactions in `db.json`, and provides budget planning and assistant endpoints. No API key is required for the local rule-based assistant.
