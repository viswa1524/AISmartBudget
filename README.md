# AISmartBudget

AISmartBudget is a lightweight HTML, CSS, JavaScript, and Python application for budget planning.

## Runtime architecture

The production website is the Python/FastAPI application:

- `main.py` serves the root `index.html` and the `/static` assets.
- `static/app.js` provides navigation, authentication, planners, and history interactions.
- `static/style.css` provides the website styling.
- `db.json` is the local persistence store.

The old React/TypeScript implementation and the duplicate `public/static` asset copy are not part of this runtime. Keep them only if you still need the legacy Node/Vite build; otherwise remove them in a local clone or through the GitHub web editor.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python main.py
```

Open <http://localhost:8000>.

The FastAPI server provides the planner, authentication, and recommendation-history endpoints. The application uses rule-based planning and does not require an API key for local development.

## Files that are part of the website

```text
index.html
main.py
db.json
static/app.js
static/style.css
requirements.txt
```

`templates/`, `tools/`, `src/`, `server.ts`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `bun.lock`, and `public/` are legacy/auxiliary files for the current Python-served website and can be removed when the Node/Vite version is no longer needed.
