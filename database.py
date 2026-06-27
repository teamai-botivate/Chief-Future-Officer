from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///cfo.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ResearchLog(Base):
    __tablename__ = "research_logs"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    summary = Column(Text)
    key_findings = Column(Text)  # JSON string
    sources = Column(Text)       # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    business_goal = Column(Text, nullable=False)
    opportunities = Column(Text)
    threats = Column(Text)
    competitors = Column(Text)
    tech_trends = Column(Text)
    roadmap = Column(Text)
    priority = Column(String(50))
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class DailyBrief(Base):
    __tablename__ = "daily_briefs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), nullable=False)   # YYYY-MM-DD
    analysis = Column(Text)
    sources = Column(Text)                       # JSON string
    generated_at = Column(DateTime, default=datetime.utcnow)


class BriefSchedule(Base):
    __tablename__ = "brief_schedule"
    id = Column(Integer, primary_key=True, index=True)
    run_time = Column(String(5), default="08:00")    # HH:MM (IST)
    run_days = Column(String(20), default="daily")   # "daily" or "1,2,3,4,5" (Mon-Fri)
    mode = Column(String(20), default="full")        # "full" = 14-point CFO analysis, "custom" = user questions
    custom_questions = Column(Text)                  # JSON list — used only when mode=custom
    last_run = Column(String(19))                    # ISO datetime of last successful run
    updated_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
