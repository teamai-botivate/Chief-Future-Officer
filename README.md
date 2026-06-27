# Chief Future Officer (CFO) — AI Strategic Business System

> **MVP Prototype** — A clickable demo showing how an AI Chief Future Officer would think for Botivate.

---

## What It Does

The CFO is an AI strategic intelligence system. You can ask it:

- *"How is AI changing ERP?"*
- *"What opportunities exist in Jewellery?"*
- *"We want to enter Healthcare — what's the strategy?"*
- *"What products should Botivate launch next?"*

It researches the web, combines Botivate's company history and vision, then generates sharp strategic recommendations.

---

## Architecture

```
User Query
    ↓
Company Knowledge  (company_data.json — Botivate history, products, goals)
    ↓
Web Research       (Tavily Search API)
    ↓
Strategic Analysis (GPT-4.1 via LangChain)
    ↓
Recommendation     (structured output to browser)
```

**Stack:** Python · FastAPI · LangGraph · LangChain · OpenAI GPT-4.1 · Tavily Search · SQLite · Vanilla HTML/CSS/JS

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10 or higher |
| pip | latest |
| OpenAI API key | [platform.openai.com](https://platform.openai.com) |
| Tavily API key | [tavily.com](https://tavily.com) — free tier available |

---

## Setup (Windows)

### 1. Install Python

Download from [python.org](https://python.org/downloads).  
During install — **check "Add Python to PATH"**.

Verify:
```powershell
python --version
```

---

### 2. Open a Terminal in the Project Folder

```powershell
cd C:\Users\prabh\Desktop\cfo_officer
```

---

### 3. Create a Virtual Environment

```powershell
python -m venv venv
```

Activate it:
```powershell
venv\Scripts\activate
```

You should see `(venv)` in your prompt.

---

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

This installs FastAPI, LangChain, LangGraph, OpenAI SDK, Tavily, SQLAlchemy, and all dependencies.

---

### 5. Create Your `.env` File

Copy the example file:
```powershell
copy .env.example .env
```

Open `.env` in Notepad and fill in your API keys:
```
OPENAI_API_KEY=sk-...your-openai-key...
TAVILY_API_KEY=tvly-...your-tavily-key...
```

**Getting API Keys:**
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Tavily (free tier): [app.tavily.com](https://app.tavily.com)

---

### 6. Run the Application

```powershell
uvicorn app:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

### 7. Open in Browser

```
http://127.0.0.1:8000
```

---

## File Structure

```
cfo_officer/
│
├── app.py              ← FastAPI backend (routes, API endpoints)
├── ai_engine.py        ← LangGraph workflow (CFO AI logic)
├── database.py         ← SQLite models (SQLAlchemy)
├── company_data.json   ← Botivate company knowledge base
│
├── index.html          ← Frontend — single page dashboard
├── style.css           ← Dark theme styles
├── script.js           ← Frontend JS logic
│
├── requirements.txt    ← Python dependencies
├── .env.example        ← API key template
├── .env                ← Your actual keys (never commit this)
└── README.md           ← This file
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves the frontend dashboard |
| `/api/health` | GET | Health check |
| `/api/history` | GET | Botivate company data |
| `/api/research` | POST | Run AI research on a question |
| `/api/recommend` | POST | Generate strategic recommendation |
| `/api/logs` | GET | View all past queries |

---

## Usage Examples

**Research Query:**
```json
POST /api/research
{ "question": "How is AI changing ERP for SMEs?" }
```

**Strategic Recommendation:**
```json
POST /api/recommend
{ "business_goal": "We want to enter the Healthcare vertical." }
```

---

## Screens

| Screen | What it shows |
|---|---|
| Dashboard | Company KPIs, quick actions, AI workflow diagram |
| Company History | Botivate timeline, products, strategic goals |
| AI Research | Ask market questions, get web-sourced AI analysis |
| Recommendations | Enter business goal → get full strategic brief |
| Logs | All past queries and recommendations |

---

## Troubleshooting

**`ModuleNotFoundError`** — Make sure the venv is activated: `venv\Scripts\activate`

**`AuthenticationError`** — Check your OpenAI API key in `.env`

**`TavilyError`** — Check your Tavily API key; free tier has 1,000 searches/month

**Port already in use** — Change port: `uvicorn app:app --reload --port 8001`

---

## Notes

- This is a **prototype** for client presentation only
- No authentication, no multi-user, no production deployment
- Database is a local SQLite file (`cfo.db`) created automatically on first run
- All AI costs are billed to your OpenAI/Tavily accounts
