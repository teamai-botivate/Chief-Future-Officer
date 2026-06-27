"""
Chief Future Officer (CFO) — FastAPI Backend
"""

import json
import os
import asyncio
import re as _re
from datetime import datetime, date
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import init_db, get_db, ResearchLog, Recommendation, DailyBrief, BriefSchedule, Task
from ai_engine import run_research, run_recommendation, run_strategic_cfo_analysis

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


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    source: str = "manual"
    source_id: int = None
    priority: str = "medium"


class TaskComplete(BaseModel):
    notes: str = ""


class ScheduleUpdate(BaseModel):
    run_time: str                   # HH:MM
    run_days: str = "daily"         # "daily" or "1,2,3,4,5"
    mode: str = "full"              # "full" or "custom"
    custom_questions: list[str] = []


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

def _get_schedule(db: Session) -> BriefSchedule:
    sched = db.query(BriefSchedule).first()
    if not sched:
        sched = BriefSchedule(
            run_time="08:00",
            run_days="daily",
            mode="full",
            custom_questions=json.dumps([]),
        )
        db.add(sched)
        db.commit()
        db.refresh(sched)
    return sched


def _should_run_today(sched: BriefSchedule) -> bool:
    """Check if today is a scheduled run day."""
    if sched.run_days == "daily":
        return True
    try:
        days = [int(d) for d in sched.run_days.split(",")]
        return datetime.now().weekday() + 1 in days  # Mon=1 … Sun=7
    except Exception:
        return True


def _already_ran_today(sched: BriefSchedule) -> bool:
    """Return True if the brief already ran today at or after the scheduled time."""
    if not sched.last_run:
        return False
    try:
        last = datetime.fromisoformat(sched.last_run)
        return last.date() == date.today()
    except Exception:
        return False


async def _generate_brief(sched: BriefSchedule) -> tuple[str, list]:
    """Run the appropriate brief mode and return (analysis_text, sources)."""
    if sched.mode == "full":
        # Full 14-point CFO strategic analysis
        result = await run_strategic_cfo_analysis()
        return result.get("analysis", ""), result.get("sources", [])
    else:
        # Custom questions mode
        questions = json.loads(sched.custom_questions or "[]")
        results, all_sources = [], []
        for q in questions:
            try:
                r = await run_research(q)
                results.append(f"### {q}\n\n{r.get('analysis', '')}")
                all_sources.extend(r.get("sources", []))
            except Exception:
                pass
        return "\n\n---\n\n".join(results), all_sources[:10]


@app.get("/api/daily-brief")
async def get_daily_brief(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    sched = _get_schedule(db)

    # Return cached brief for today if already ran
    brief = db.query(DailyBrief).filter(DailyBrief.date == today).first()
    if brief:
        return {
            "date": brief.date,
            "analysis": brief.analysis,
            "sources": json.loads(brief.sources or "[]"),
            "generated_at": brief.generated_at.isoformat(),
            "mode": sched.mode,
            "cached": True,
        }

    # Auto-generate if: today is a run day AND current time >= scheduled time
    now_time = datetime.now().strftime("%H:%M")
    should_auto = _should_run_today(sched) and now_time >= sched.run_time

    if not should_auto:
        return {
            "date": today,
            "analysis": None,
            "sources": [],
            "generated_at": None,
            "mode": sched.mode,
            "cached": False,
            "next_run": sched.run_time,
            "message": f"Scheduled for {sched.run_time} IST. Open the dashboard after that time to auto-generate.",
        }

    analysis, sources = await _generate_brief(sched)

    brief = DailyBrief(
        date=today,
        analysis=analysis,
        sources=json.dumps(sources),
        generated_at=datetime.utcnow(),
    )
    db.add(brief)
    # Update last_run on schedule
    sched.last_run = datetime.now().isoformat(timespec="seconds")
    db.commit()
    db.refresh(brief)

    return {
        "date": brief.date,
        "analysis": brief.analysis,
        "sources": json.loads(brief.sources or "[]"),
        "generated_at": brief.generated_at.isoformat(),
        "mode": sched.mode,
        "cached": False,
    }


@app.post("/api/daily-brief/regenerate")
async def regenerate_daily_brief(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    existing = db.query(DailyBrief).filter(DailyBrief.date == today).first()
    if existing:
        db.delete(existing)
        db.commit()
    sched = _get_schedule(db)
    analysis, sources = await _generate_brief(sched)
    brief = DailyBrief(
        date=today,
        analysis=analysis,
        sources=json.dumps(sources),
        generated_at=datetime.utcnow(),
    )
    db.add(brief)
    sched.last_run = datetime.now().isoformat(timespec="seconds")
    db.commit()
    db.refresh(brief)
    return {
        "date": brief.date,
        "analysis": brief.analysis,
        "sources": json.loads(brief.sources or "[]"),
        "generated_at": brief.generated_at.isoformat(),
        "mode": sched.mode,
        "cached": False,
    }


@app.get("/api/schedule")
def get_schedule(db: Session = Depends(get_db)):
    sched = _get_schedule(db)
    return {
        "run_time": sched.run_time,
        "run_days": sched.run_days,
        "mode": sched.mode,
        "custom_questions": json.loads(sched.custom_questions or "[]"),
        "last_run": sched.last_run,
        "updated_at": sched.updated_at.isoformat() if sched.updated_at else "",
    }


@app.post("/api/schedule")
def update_schedule(req: ScheduleUpdate, db: Session = Depends(get_db)):
    if not _re.match(r"^\d{2}:\d{2}$", req.run_time):
        raise HTTPException(status_code=400, detail="run_time must be HH:MM format")
    if req.mode not in ("full", "custom"):
        raise HTTPException(status_code=400, detail="mode must be 'full' or 'custom'")
    if req.mode == "custom" and not req.custom_questions:
        raise HTTPException(status_code=400, detail="At least one question required for custom mode")

    sched = _get_schedule(db)
    sched.run_time = req.run_time
    sched.run_days = req.run_days
    sched.mode = req.mode
    sched.custom_questions = json.dumps(req.custom_questions[:10])
    sched.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sched)
    return {
        "run_time": sched.run_time,
        "run_days": sched.run_days,
        "mode": sched.mode,
        "custom_questions": json.loads(sched.custom_questions),
        "updated_at": sched.updated_at.isoformat(),
    }


# ── Tasks ─────────────────────────────────────────────────────────────────────

def _task_dict(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description or "",
        "source": t.source,
        "source_id": t.source_id,
        "status": t.status,
        "priority": t.priority,
        "created_at": t.created_at.isoformat() if t.created_at else "",
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "notes": t.notes or "",
    }


@app.get("/api/tasks")
def get_tasks(db: Session = Depends(get_db)):
    pending = db.query(Task).filter(Task.status == "pending").order_by(Task.created_at.desc()).all()
    done    = db.query(Task).filter(Task.status == "done").order_by(Task.completed_at.desc()).limit(50).all()
    return {
        "pending": [_task_dict(t) for t in pending],
        "done":    [_task_dict(t) for t in done],
    }


@app.post("/api/tasks")
def create_task(req: TaskCreate, db: Session = Depends(get_db)):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    task = Task(
        title=req.title.strip(),
        description=req.description.strip(),
        source=req.source,
        source_id=req.source_id,
        priority=req.priority,
        created_at=datetime.utcnow(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_dict(task)


@app.post("/api/tasks/{task_id}/complete")
def complete_task(task_id: int, req: TaskComplete, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "done"
    task.completed_at = datetime.utcnow()
    task.notes = req.notes.strip()
    db.commit()
    db.refresh(task)
    return _task_dict(task)


@app.post("/api/tasks/{task_id}/reopen")
def reopen_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "pending"
    task.completed_at = None
    task.notes = ""
    db.commit()
    db.refresh(task)
    return _task_dict(task)


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


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
