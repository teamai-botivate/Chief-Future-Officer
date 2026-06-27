"""
Chief Future Officer - AI Engine
LangGraph workflow: Query → Company Knowledge → Botivate Self-Research → Web Research → Strategic Analysis → Output
Roles: Business Coach + Financial Advisor + Location Intelligence + Market Strategist
"""

import json
import os
from typing import TypedDict
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END

load_dotenv()

# ── Models & Tools ────────────────────────────────────────────────────────────

llm = ChatOpenAI(model="gpt-4.1", temperature=0.3)
search_tool = TavilySearchResults(max_results=5)

# ── Load Company Knowledge ────────────────────────────────────────────────────

_company_data_path = os.path.join(os.path.dirname(__file__), "company_data.json")
with open(_company_data_path, "r", encoding="utf-8") as f:
    COMPANY_DATA = json.load(f)

def _build_company_context(data: dict) -> str:
    c = data["company"]
    fm = data.get("financial_status", {})
    bm = data.get("business_metrics", {})
    li = data.get("location_intelligence", {})
    gaps = data.get("known_gaps", [])
    hiring = data.get("hiring_status", {})

    # Nearby cities
    nearby = li.get("nearby_cities_to_target", [])
    nearby_str = "\n".join(
        f"  - {ct['city']} ({ct.get('distance_from_raipur','?')} from HQ): {ct.get('key_industries',[])} — {ct.get('opportunity','')}"
        for ct in nearby[:6]
    )

    # Local competitors
    local_comp = li.get("local_competitors", [])
    comp_str = "\n".join(
        f"  - {co['name']}: {co.get('positioning','')} | Threat: {co.get('threat_level','')}"
        for co in local_comp
    )

    # Open roles
    roles = hiring.get("open_roles", [])
    roles_str = ", ".join(roles[:6])

    return f"""
COMPANY: {c['name']} ({c.get('legal_name','')})
Founded: {c.get('founded','')} | HQ: {c.get('headquarters','')}
Stage: {c.get('stage','')}
Website: {c.get('website','')} | Phone: {c.get('phone','')}

FOUNDERS:
{chr(10).join(f"  - {f['name']} ({f['role']}): {f.get('background','')}" for f in data.get('founders',[]))}

FINANCIAL STATUS:
  Funding: {fm.get('funding_stage','Unknown')}
  Authorized Capital: {fm.get('authorized_capital','?')}
  Paid-up Capital: {fm.get('paid_up_capital','?')}
  Annual Revenue: {fm.get('annual_revenue','Not disclosed')}
  Monthly Revenue: {fm.get('monthly_revenue','Not disclosed')}
  Monthly Expenses: {fm.get('monthly_expenses','Not disclosed')}
  Cash in Bank: {fm.get('cash_in_bank','Not disclosed')}
  MCA Status: {fm.get('mca_status','')}
  E-filing Status: {fm.get('efiling_status','')}

BUSINESS METRICS:
  Team Size: {bm.get('team_size','?')}
  Active Clients: {bm.get('active_clients','Not disclosed')}
  Avg Contract Value: {bm.get('avg_contract_value','Not disclosed')}
  Monthly Recurring Revenue: {bm.get('monthly_recurring_revenue','Not disclosed')}
  Client Retention: {bm.get('client_retention_rate','Not disclosed')}
  LinkedIn Followers: {bm.get('linkedin_followers','655')}

MISSION: {data.get('mission','')}
VISION: {data.get('vision','')}

PRODUCT — AutoRocket:
  {data.get('core_product',{}).get('description','')}
  Public Presence: {data.get('core_product',{}).get('public_presence','Zero')}
  Modules: {', '.join(data.get('modules_built',[])[:15])}

INDUSTRIES SERVED: {', '.join(data.get('industries_served',[]))}

BUSINESS STRATEGY:
{chr(10).join(f"  {i+1}. {s}" for i,s in enumerate(data.get('business_strategy',[])))}

COMPETITIVE ADVANTAGES:
{chr(10).join(f"  - {a}" for a in data.get('competitive_advantages',[]))}

LOCATION INTELLIGENCE — NEARBY MARKETS:
{nearby_str}

LOCAL COMPETITORS IN RAIPUR (115+ total):
{comp_str}

KNOWN GAPS (honest assessment):
{chr(10).join(f"  - {g}" for g in gaps)}

HIRING NOW: {roles_str}

KEY LESSONS LEARNED:
{chr(10).join(f"  - {l}" for l in data.get('lessons_learned',[]))}

FUTURE VISION:
{chr(10).join(f"  - {v}" for v in data.get('future_vision',{}).get('roadmap',[]))}
Ultimate Goal: {data.get('future_vision',{}).get('ultimate_goal','')}
""".strip()


COMPANY_CONTEXT = _build_company_context(COMPANY_DATA)

# Queries to research Botivate's own external web presence
BOTIVATE_SELF_QUERIES = [
    "Botivate botivate.in India business automation software Raipur",
    "AutoRocket ERP CRM India reviews Botivate alternatives",
]


# ── CFO System Prompt — 4 Roles ───────────────────────────────────────────────

CFO_SYSTEM_ROLES = """You are the Chief Future Officer (CFO) of Botivate — a 4-in-1 AI strategic intelligence system.

You operate in 4 roles simultaneously:

ROLE 1 — BUSINESS COACH
Think like a seasoned business coach who knows Botivate inside-out.
- Give direct, actionable advice on what to do this week, this month, this quarter
- Coach on team structure, priorities, energy allocation, focus
- Be honest about what is working and what is not
- Push Botivate to act, not just plan

ROLE 2 — FINANCIAL ADVISOR
Think like a CFO + financial advisor for an early-stage bootstrapped startup.
- Advise on where to invest, how much, and expected ROI
- Identify cash flow risks, revenue opportunities, cost optimizations
- Recommend pricing strategy, contract structures, revenue streams
- Flag financial compliance gaps (MCA filing, GST, contracts)
- Give specific numbers, not vague guidance

ROLE 3 — LOCATION INTELLIGENCE EXPERT
Think like a market expansion consultant who knows Central India deeply.
- Identify which nearby cities and industries are best next targets
- Map Raipur/CG/MP market opportunities to Botivate's specific modules
- Identify local competitor weaknesses Botivate can exploit
- Recommend city-by-city GTM approach

ROLE 4 — MARKET STRATEGIST
Think like a McKinsey strategist who tracks India's B2B SaaS market.
- Connect market trends to Botivate's specific opportunities
- Analyze competitors (local Raipur vendors + national players like Zoho, Tally)
- Identify product gaps vs market demand
- Recommend positioning and differentiation strategy

CRITICAL GROUND RULES:
- Always base recommendations on Botivate's REAL current position — bootstrapped, unfunded, early-stage, minimal brand presence
- Never assume Botivate has marketing budget, large team, or brand recognition unless data says so
- Be specific — real city names, real competitor names, real INR numbers, real timelines
- Prioritize what can be done with a small team and limited budget
- Flag the MCA e-filing compliance gap as urgent whenever relevant
"""


# ── Graph State ───────────────────────────────────────────────────────────────

class CFOState(TypedDict):
    mode: str
    query: str
    company_context: str
    botivate_web_context: str
    web_results: list
    analysis: str
    output: dict


# ── Graph Nodes ───────────────────────────────────────────────────────────────

def load_company_knowledge(state: CFOState) -> CFOState:
    state["company_context"] = COMPANY_CONTEXT
    state["botivate_web_context"] = ""
    return state


def botivate_self_research(state: CFOState) -> CFOState:
    """Search web for Botivate's real external presence — grounds AI in reality."""
    results = []
    for query in BOTIVATE_SELF_QUERIES:
        try:
            r = search_tool.invoke(query)
            if isinstance(r, list):
                results.extend(r[:2])
        except Exception:
            pass

    if results:
        snippets = "\n\n".join(
            f"[{r.get('url', 'unknown')}]\n{r.get('content', '')[:500]}"
            for r in results[:6]
        )
        state["botivate_web_context"] = snippets
    else:
        state["botivate_web_context"] = (
            "No external Botivate web presence found. "
            "Brand visibility is minimal — no public reviews, no media mentions, no app store listing."
        )
    return state


def web_research(state: CFOState) -> CFOState:
    """Search the web for market/topic intelligence relevant to the query."""
    try:
        results = search_tool.invoke(state["query"])
        state["web_results"] = results if isinstance(results, list) else []
    except Exception as e:
        state["web_results"] = [{"content": f"Search unavailable: {str(e)}", "url": ""}]
    return state


def strategic_analysis(state: CFOState) -> CFOState:
    """4-role AI analysis combining company data + Botivate web presence + market research."""
    web_snippets = "\n\n".join(
        f"Source: {r.get('url', 'unknown')}\n{r.get('content', '')[:600]}"
        for r in state["web_results"][:5]
    )

    system_prompt = f"""{CFO_SYSTEM_ROLES}

BOTIVATE INTERNAL DATA (from company records):
{state['company_context']}

BOTIVATE EXTERNAL WEB PRESENCE (what the world actually sees right now):
{state['botivate_web_context']}
"""

    if state["mode"] == "research":
        user_msg = f"""Research Question: {state['query']}

Market & Topic Research:
{web_snippets}

Respond as all 4 CFO roles. Provide:

### EXECUTIVE SUMMARY
2-3 sentences on what this means for Botivate right now.

### KEY FINDINGS
5-7 bullet points from the research.

### WHAT THIS MEANS FOR BOTIVATE
3-4 specific implications given Botivate's current stage, location (Raipur/CG), and market position.

### BUSINESS COACH ADVICE
What should the founding team do about this — this week and this month?

### FINANCIAL ANGLE
Any investment, revenue, or cost implications?

### LOCAL MARKET ANGLE
How does this apply to Raipur, Bhilai, Bilaspur, and nearby CG/MP markets?

### RECOMMENDED NEXT STEPS
3-4 concrete actions Botivate can take with current team and budget."""

    else:  # recommend mode
        user_msg = f"""Business Goal: {state['query']}

Market Research:
{web_snippets}

Respond as all 4 CFO roles. Generate a full strategic recommendation:

### OPPORTUNITIES
3-5 specific opportunities — include which nearby cities/industries to target first.

### THREATS
3-4 threats — include local Raipur competitors and national players.

### COMPETITORS
2-3 most relevant competitors. What they're doing. How to beat them.

### TECHNOLOGY TRENDS
3-4 key tech trends relevant to this goal.

### FINANCIAL RECOMMENDATION
How much to invest, where, expected return, timeline. Real INR numbers.

### BUSINESS COACH ADVICE
What should the team focus on? What to stop doing? What to start immediately?

### LOCAL MARKET STRATEGY
Which cities to target first — Bhilai, Bilaspur, Durg, Nagpur, Indore? Which industries in each city?

### RECOMMENDED ROADMAP
4-5 sequential steps with timeline and owner (Founder/Tech/Sales).

### PRIORITY
High / Medium / Low — with one-line justification.

### CONFIDENCE
0-100% — with one-line justification based on Botivate's real current position."""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_msg)])
    state["analysis"] = response.content
    return state


def format_output(state: CFOState) -> CFOState:
    sources = [
        {"url": r.get("url", ""), "title": r.get("url", "Source").split("/")[-1][:60]}
        for r in state["web_results"]
        if r.get("url")
    ]
    if state["mode"] == "research":
        state["output"] = {
            "mode": "research",
            "query": state["query"],
            "analysis": state["analysis"],
            "sources": sources,
        }
    else:
        state["output"] = {
            "mode": "recommend",
            "goal": state["query"],
            "analysis": state["analysis"],
            "sources": sources,
        }
    return state


# ── Build Graph ───────────────────────────────────────────────────────────────

def build_cfo_graph():
    graph = StateGraph(CFOState)
    graph.add_node("load_company_knowledge", load_company_knowledge)
    graph.add_node("botivate_self_research", botivate_self_research)
    graph.add_node("web_research", web_research)
    graph.add_node("strategic_analysis", strategic_analysis)
    graph.add_node("format_output", format_output)
    graph.set_entry_point("load_company_knowledge")
    graph.add_edge("load_company_knowledge", "botivate_self_research")
    graph.add_edge("botivate_self_research", "web_research")
    graph.add_edge("web_research", "strategic_analysis")
    graph.add_edge("strategic_analysis", "format_output")
    graph.add_edge("format_output", END)
    return graph.compile()


CFO_GRAPH = build_cfo_graph()


# ── Public API ────────────────────────────────────────────────────────────────

async def run_research(question: str) -> dict:
    initial_state: CFOState = {
        "mode": "research",
        "query": question,
        "company_context": "",
        "botivate_web_context": "",
        "web_results": [],
        "analysis": "",
        "output": {},
    }
    result = await CFO_GRAPH.ainvoke(initial_state)
    return result["output"]


async def run_recommendation(business_goal: str) -> dict:
    initial_state: CFOState = {
        "mode": "recommend",
        "query": business_goal,
        "company_context": "",
        "botivate_web_context": "",
        "web_results": [],
        "analysis": "",
        "output": {},
    }
    result = await CFO_GRAPH.ainvoke(initial_state)
    return result["output"]


# ── Strategic CFO Analysis (Full 14-Point Daily Report) ──────────────────────

BOTIVATE_SELF_QUERIES_FULL = [
    "Botivate botivate.in India automation software Raipur Chhattisgarh",
    "AutoRocket ERP CRM Botivate reviews India SME",
]

CFO_MARKET_QUERIES = [
    "business automation AI ERP trends India 2025 2026 SME market",
    "Zoho SAP Odoo ERPNext Vyapar new features AI agents 2025 2026",
    "Indian SME digital transformation Chhattisgarh Madhya Pradesh opportunities",
    "AI agents autonomous business automation market growth India B2B SaaS",
]

CFO_MASTER_PROMPT = """You are the Chief Future Officer of Botivate — operating as Business Coach + Financial Advisor + Location Expert + Market Strategist.
Today's date: {today}.

Generate a comprehensive MASTER STRATEGIC INTELLIGENCE REPORT for Botivate leadership.
This report is automatically delivered every morning to the founding team.

BOTIVATE INTERNAL DATA:
{company_context}

BOTIVATE EXTERNAL WEB PRESENCE (what the world sees about Botivate today):
{botivate_web_presence}

MARKET INTELLIGENCE (current industry research):
{web_research}

CRITICAL: Ground every recommendation in Botivate's REAL position — bootstrapped, unfunded, Raipur-based, minimal brand presence, early growth stage. Give specific INR numbers, real city names, real competitor names. Be brutally honest. Think like someone who has worked inside Botivate and also reads the market daily.

---

## EXECUTIVE SUMMARY
3-4 sentences. Most critical thing Botivate must act on TODAY, given real market position and current stage.

---

## 1. NEXT PRODUCTS TO BUILD
Top 5 products Botivate should build next.
For each: Product Name | Target Market (which city/industry) | Market Size | Why Now | Revenue Potential (INR/month)

---

## 2. PRODUCT IMPROVEMENTS — AUTOROCKET
Top 10 specific improvements needed in AutoRocket right now.
For each: What | Why | Impact if done | Risk if ignored

---

## 3. FINANCIAL RECOMMENDATIONS
As Financial Advisor — where should Botivate invest its limited budget?
- Current financial reality (what we know)
- Top 5 investment priorities with INR amounts and expected returns
- Revenue streams to add in next 90 days
- Cost optimization opportunities
- URGENT: MCA e-filing compliance — what to do

---

## 4. BUSINESS COACH — WHERE TO FOCUS NOW
As Business Coach — direct advice to the founding team:
- Which department needs most attention right now?
- What are the founders spending time on that they should STOP?
- What are they NOT doing that they MUST start?
- Team gaps based on current hiring (Flutter dev, AI intern, etc.)
- Weekly focus recommendation

---

## 5. GO-TO-MARKET STRATEGIES
Top 5 GTM strategies for next 12 months.
For each: Strategy | Target City + Industry | Action Steps | Expected Outcome | Timeline

---

## 6. LOCATION INTELLIGENCE — CITY-BY-CITY EXPANSION
As Location Expert — which cities to enter next and in what order:
- Bhilai: opportunity + first action
- Bilaspur: opportunity + first action
- Durg: opportunity + first action
- Nagpur: opportunity + first action
- Indore: opportunity + first action
Which city to enter FIRST and why?

---

## 7. CLIENT INTELLIGENCE
Based on industries served (manufacturing, steel, coal, healthcare, jewellery):
- Which client type generates highest contract value?
- Which industry has fastest sales cycle?
- Which modules are most in-demand right now?
- Referral strategy — how to get more clients from existing ones

---

## 8. COMPETITOR ANALYSIS
Local: Lighthouse ERP, Link Ideas, Softweb Technologies (Raipur)
National: Zoho, Tally, ERPNext, Vyapar, Odoo
For each: What they're doing | What Botivate is missing | How to beat them

---

## 9. BOTIVATE'S LIMITATIONS — HONEST ASSESSMENT
Top 8 limitations. Be brutally honest.
For each: Limitation | Root Cause | Business Impact | Fix

---

## 10. GAP ANALYSIS
Quantify gaps vs market leaders:
Brand | Product Depth | Mobile | SEO/Digital Presence | Case Studies | Pricing Strategy | Channel | AI Capability

---

## 11. HOW TO BECOME THE BEST IN CG/MP MARKET
For top 5 gaps: Exact solution | Steps | Timeline | Owner | Expected outcome
Focus on dominating Chhattisgarh + MP first before going national.

---

## 12. NETWORK & NETWORTH
- Estimated company networth today (based on team, modules, clients, recurring revenue)
- Network to build: CA firms, industry associations (CII, MSME), government bodies, banker networks in Raipur
- Partnership opportunities in Raipur ecosystem

---

## 13. BOTIVATE KA FUTURE — IF EXECUTED
Month 6: What will be different
Month 12: Where will Botivate stand in CG market
Month 24: Market position in Central India
Month 36: National presence scenario

---

## 14. 90-DAY ACTION PLAN
Week 1-2: Immediate actions (quick wins — zero or low cost)
Week 3-4: Short term moves
Month 2: Key milestones
Month 3: End state — what should be true by Day 90

---

ONE-LINE VERDICT: The single most important thing Botivate must do this week.
"""


async def run_strategic_cfo_analysis() -> dict:
    """
    Full 14-point CFO strategic analysis.
    Phase 1: Botivate self-research (real web presence).
    Phase 2: Market intelligence research.
    Phase 3: Master report combining all data — 4 roles.
    """
    # Phase 1: Botivate external presence
    botivate_results = []
    for query in BOTIVATE_SELF_QUERIES_FULL:
        try:
            r = search_tool.invoke(query)
            if isinstance(r, list):
                botivate_results.extend(r[:2])
        except Exception:
            pass

    botivate_snippets = "\n\n".join(
        f"[{r.get('url','')}]\n{r.get('content','')[:400]}"
        for r in botivate_results[:6]
    ) or "No external Botivate web presence found — brand visibility is near zero."

    # Phase 2: Market intelligence
    market_results = []
    for query in CFO_MARKET_QUERIES:
        try:
            r = search_tool.invoke(query)
            if isinstance(r, list):
                market_results.extend(r[:3])
        except Exception:
            pass

    market_snippets = "\n\n".join(
        f"[{r.get('url','')}]\n{r.get('content','')[:500]}"
        for r in market_results[:12]
    ) or "Market research unavailable — analysis based on company knowledge."

    all_sources = [
        {"url": r.get("url",""), "title": (r.get("url","") or "").split("/")[-1][:60]}
        for r in (botivate_results + market_results)
        if r.get("url")
    ]

    from datetime import date as _date
    today_str = _date.today().strftime("%B %d, %Y")

    prompt = CFO_MASTER_PROMPT.format(
        today=today_str,
        company_context=COMPANY_CONTEXT,
        botivate_web_presence=botivate_snippets,
        web_research=market_snippets,
    )

    response = llm.invoke([HumanMessage(content=prompt)])
    return {
        "mode": "strategic_cfo",
        "analysis": response.content,
        "sources": all_sources[:15],
    }
