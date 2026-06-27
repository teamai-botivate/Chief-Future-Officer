"""
Chief Future Officer (CFO) — FastAPI Backend
"""

import json
import os
import asyncio
from datetime import datetime, date
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import init_db, get_db, ResearchLog, Recommendation, DailyBrief, BriefSchedule
from ai_engine import run_research, run_recommendation

load_dotenv()

app = FastAPI(title="Chief Future Officer", version="1.0.0")

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    init_db()


# ── Static files & SPA ────────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory="."), name="static")


@app.get("/")
def serve_index():
    return FileResponse("index.html")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    question: str


class RecommendRequest(BaseModel):
    business_goal: str


class ScheduleUpdate(BaseModel):
    run_time: str        # HH:MM
    questions: list[str]


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "Chief Future Officer",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Company History ────────────────────────────────────────────────────────────

@app.get("/api/history")
def get_history():
    data_path = os.path.join(os.path.dirname(__file__), "company_data.json")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        "company": data["company"],
        "description": data["description"],
        "mission": data["mission"],
        "vision": data["vision"],
        "founding_story": data.get("founding_story", ""),
        "history": data.get("evolution_phases", []),
        "vision_evolution": data.get("vision_evolution", []),
        "core_product": data.get("core_product", {}),
        "modules": data.get("modules_built", []),
        "industries": data.get("industries_served", []),
        "metrics": data.get("key_metrics", {}),
        "strategy": data.get("business_strategy", []),
        "key_decisions": data.get("key_decisions", []),
        "lessons": data.get("lessons_learned", []),
        "competitive_advantages": data.get("competitive_advantages", []),
        "future_vision": data.get("future_vision", {}),
        "technology_evolution": data.get("technology_evolution", []),
    }


# ── Research ───────────────────────────────────────────────────────────────────

@app.post("/api/research")
async def research(req: ResearchRequest, db: Session = Depends(get_db)):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = await run_research(req.question)

    log = ResearchLog(
        question=req.question,
        summary=result.get("analysis", ""),
        sources=json.dumps(result.get("sources", [])),
        created_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "id": log.id,
        "question": req.question,
        "analysis": result.get("analysis", ""),
        "sources": result.get("sources", []),
        "created_at": log.created_at.isoformat(),
    }


# ── Strategic Recommendation ───────────────────────────────────────────────────

@app.post("/api/recommend")
async def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    if not req.business_goal.strip():
        raise HTTPException(status_code=400, detail="Business goal cannot be empty")

    result = await run_recommendation(req.business_goal)
    analysis_text = result.get("analysis", "")

    # Parse priority and confidence from the text if present
    priority = "High"
    confidence = 75.0
    for line in analysis_text.splitlines():
        if line.strip().upper().startswith("PRIORITY:"):
            val = line.split(":", 1)[-1].strip()
            if "high" in val.lower():
                priority = "High"
            elif "medium" in val.lower():
                priority = "Medium"
            elif "low" in val.lower():
                priority = "Low"
        if line.strip().upper().startswith("CONFIDENCE:"):
            import re
            nums = re.findall(r"\d+", line)
            if nums:
                confidence = float(nums[0])

    rec = Recommendation(
        business_goal=req.business_goal,
        opportunities=analysis_text,
        priority=priority,
        confidence=confidence,
        created_at=datetime.utcnow(),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "id": rec.id,
        "business_goal": req.business_goal,
        "analysis": analysis_text,
        "sources": result.get("sources", []),
        "priority": priority,
        "confidence": confidence,
        "created_at": rec.created_at.isoformat(),
    }


# ── Daily Brief ───────────────────────────────────────────────────────────────

DEFAULT_QUESTIONS = [
    "What are the top business automation and AI trends this week?",
    "What opportunities should Botivate pursue in the next 30 days?",
    "What competitive threats should Botivate watch right now?",
]


def _get_schedule(db: Session) -> BriefSchedule:
    sched = db.query(BriefSchedule).first()
    if not sched:
        sched = BriefSchedule(
            run_time="08:00",
            questions=json.dumps(DEFAULT_QUESTIONS),
        )
        db.add(sched)
        db.commit()
        db.refresh(sched)
    return sched


@app.get("/api/daily-brief")
async def get_daily_brief(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    brief = db.query(DailyBrief).filter(DailyBrief.date == today).first()

    if brief:
        return {
            "date": brief.date,
            "analysis": brief.analysis,
            "sources": json.loads(brief.sources or "[]"),
            "generated_at": brief.generated_at.isoformat(),
            "cached": True,
        }

    # Generate fresh brief
    sched = _get_schedule(db)
    questions = json.loads(sched.questions or "[]") or DEFAULT_QUESTIONS

    results = []
    all_sources = []
    for q in questions:
        try:
            r = await run_research(q)
            results.append(f"QUESTION: {q}\n\n{r.get('analysis', '')}")
            all_sources.extend(r.get("sources", []))
        except Exception:
            pass

    combined = "\n\n---\n\n".join(results)

    brief = DailyBrief(
        date=today,
        analysis=combined,
        sources=json.dumps(all_sources[:10]),
        generated_at=datetime.utcnow(),
    )
    db.add(brief)
    db.commit()
    db.refresh(brief)

    return {
        "date": brief.date,
        "analysis": brief.analysis,
        "sources": json.loads(brief.sources or "[]"),
        "generated_at": brief.generated_at.isoformat(),
        "cached": False,
    }


@app.post("/api/daily-brief/regenerate")
async def regenerate_daily_brief(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    existing = db.query(DailyBrief).filter(DailyBrief.date == today).first()
    if existing:
        db.delete(existing)
        db.commit()
    return await get_daily_brief(db)


@app.get("/api/schedule")
def get_schedule(db: Session = Depends(get_db)):
    sched = _get_schedule(db)
    return {
        "run_time": sched.run_time,
        "questions": json.loads(sched.questions or "[]"),
        "updated_at": sched.updated_at.isoformat() if sched.updated_at else "",
    }


@app.post("/api/schedule")
def update_schedule(req: ScheduleUpdate, db: Session = Depends(get_db)):
    import re
    if not re.match(r"^\d{2}:\d{2}$", req.run_time):
        raise HTTPException(status_code=400, detail="run_time must be HH:MM format")
    if not req.questions:
        raise HTTPException(status_code=400, detail="At least one question required")

    sched = _get_schedule(db)
    sched.run_time = req.run_time
    sched.questions = json.dumps(req.questions[:5])  # max 5 questions
    sched.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sched)
    return {
        "run_time": sched.run_time,
        "questions": json.loads(sched.questions),
        "updated_at": sched.updated_at.isoformat(),
    }


# ── Logs ───────────────────────────────────────────────────────────────────────

@app.get("/api/logs")
def get_logs(db: Session = Depends(get_db)):
    research_logs = db.query(ResearchLog).order_by(ResearchLog.created_at.desc()).limit(20).all()
    rec_logs = db.query(Recommendation).order_by(Recommendation.created_at.desc()).limit(20).all()

    logs = []
    for r in research_logs:
        logs.append({
            "type": "research",
            "id": r.id,
            "input": r.question,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        })
    for r in rec_logs:
        logs.append({
            "type": "recommendation",
            "id": r.id,
            "input": r.business_goal,
            "priority": r.priority,
            "confidence": r.confidence,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        })

    logs.sort(key=lambda x: x["created_at"], reverse=True)
    return {"logs": logs}
