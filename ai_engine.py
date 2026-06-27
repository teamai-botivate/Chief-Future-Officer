"""
Chief Future Officer - AI Engine
LangGraph workflow: Query → Company Knowledge → Web Research → Strategic Analysis → Recommendation
"""

import json
import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END

load_dotenv()

# ── Models & Tools ────────────────────────────────────────────────────────────

llm = ChatOpenAI(model="gpt-4.1", temperature=0.3)

search_tool = TavilySearchResults(max_results=5)

# Load company knowledge once at startup
_company_data_path = os.path.join(os.path.dirname(__file__), "company_data.json")
with open(_company_data_path, "r", encoding="utf-8") as f:
    COMPANY_DATA = json.load(f)

COMPANY_CONTEXT = f"""
Company: {COMPANY_DATA['company']['name']}
Tagline: {COMPANY_DATA['company']['tagline']}
Description: {COMPANY_DATA['description']}
Mission: {COMPANY_DATA['mission']}
Vision: {COMPANY_DATA['vision']}

Flagship Product: {COMPANY_DATA['company']['flagship_product']}
AutoRocket: {COMPANY_DATA['core_product']['description']}

Founding Story: {COMPANY_DATA['founding_story']}

Business Strategy (how Botivate works with every client):
{chr(10).join(str(i+1) + '. ' + s for i, s in enumerate(COMPANY_DATA['business_strategy']))}

Industries Served: {', '.join(COMPANY_DATA['industries_served'])}

Competitive Advantages:
{chr(10).join('- ' + a for a in COMPANY_DATA['competitive_advantages'])}

Key Lessons Learned:
{chr(10).join('- ' + l for l in COMPANY_DATA['lessons_learned'])}

Key Strategic Decisions Made:
{chr(10).join('- ' + d for d in COMPANY_DATA['key_decisions'])}

Future Vision:
{chr(10).join('- ' + v for v in COMPANY_DATA['future_vision']['roadmap'])}
Ultimate Goal: {COMPANY_DATA['future_vision']['ultimate_goal']}

Modules Built (70+): {', '.join(COMPANY_DATA['modules_built'])}
Team Size: {COMPANY_DATA['team']['size']} people
""".strip()


# ── Graph State ───────────────────────────────────────────────────────────────

class CFOState(TypedDict):
    mode: str           # "research" or "recommend"
    query: str
    company_context: str
    web_results: list
    analysis: str
    output: dict


# ── Graph Nodes ───────────────────────────────────────────────────────────────

def load_company_knowledge(state: CFOState) -> CFOState:
    """Inject Botivate company context into the state."""
    state["company_context"] = COMPANY_CONTEXT
    return state


def web_research(state: CFOState) -> CFOState:
    """Search the web for relevant information about the query."""
    query = state["query"]
    try:
        results = search_tool.invoke(query)
        state["web_results"] = results if isinstance(results, list) else []
    except Exception as e:
        state["web_results"] = [{"content": f"Search unavailable: {str(e)}", "url": ""}]
    return state


def strategic_analysis(state: CFOState) -> CFOState:
    """Use LLM to analyse company context + web results together."""
    web_snippets = "\n\n".join(
        f"Source: {r.get('url', 'unknown')}\n{r.get('content', '')[:600]}"
        for r in state["web_results"][:5]
    )

    system_prompt = f"""You are the Chief Future Officer (CFO) of Botivate — an AI strategic intelligence system.

Your job is to provide sharp, actionable strategic intelligence by combining:
1. Deep knowledge of Botivate's business context
2. Current web research findings

Always be specific, concise, and commercially grounded.
Think like a seasoned strategy consultant who knows Botivate inside-out.

BOTIVATE COMPANY CONTEXT:
{state['company_context']}
"""

    if state["mode"] == "research":
        user_msg = f"""Research Question: {state['query']}

Web Research Findings:
{web_snippets}

Provide a structured research brief with:
1. Executive Summary (3-4 sentences)
2. Key Findings (5-7 bullet points)
3. What This Means for Botivate (2-3 specific implications)
4. Recommended Next Steps (2-3 actions)

Be specific. Reference Botivate's products and goals where relevant."""

    else:  # recommend mode
        user_msg = f"""Business Goal: {state['query']}

Web Research Findings:
{web_snippets}

Generate a strategic recommendation with these exact sections:

OPPORTUNITIES: (3-5 specific opportunities for Botivate to pursue)
THREATS: (3-4 threats or risks to watch)
COMPETITORS: (2-3 relevant competitors or alternatives in this space)
TECHNOLOGY TRENDS: (3-4 key tech trends shaping this area)
RECOMMENDED ROADMAP: (4-5 sequential steps Botivate should take)
PRIORITY: (High / Medium / Low - with one line justification)
CONFIDENCE: (percentage 0-100 with one line justification)

Be specific to Botivate's actual capabilities, products, and market position."""

    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_msg)])
    state["analysis"] = response.content
    return state


def format_output(state: CFOState) -> CFOState:
    """Structure the final output for the API response."""
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
    graph.add_node("web_research", web_research)
    graph.add_node("strategic_analysis", strategic_analysis)
    graph.add_node("format_output", format_output)

    graph.set_entry_point("load_company_knowledge")
    graph.add_edge("load_company_knowledge", "web_research")
    graph.add_edge("web_research", "strategic_analysis")
    graph.add_edge("strategic_analysis", "format_output")
    graph.add_edge("format_output", END)

    return graph.compile()


CFO_GRAPH = build_cfo_graph()


# ── Public API ────────────────────────────────────────────────────────────────

async def run_research(question: str) -> dict:
    """Run the CFO graph in research mode."""
    initial_state: CFOState = {
        "mode": "research",
        "query": question,
        "company_context": "",
        "web_results": [],
        "analysis": "",
        "output": {},
    }
    result = await CFO_GRAPH.ainvoke(initial_state)
    return result["output"]


async def run_recommendation(business_goal: str) -> dict:
    """Run the CFO graph in recommendation mode."""
    initial_state: CFOState = {
        "mode": "recommend",
        "query": business_goal,
        "company_context": "",
        "web_results": [],
        "analysis": "",
        "output": {},
    }
    result = await CFO_GRAPH.ainvoke(initial_state)
    return result["output"]


# ── Strategic CFO Analysis (Full 14-Point Deep Report) ───────────────────────

CFO_STRATEGIC_QUERIES = [
    "business automation AI ERP trends India 2025 2026 SME market",
    "Zoho SAP Odoo ERPNext Vyapar new features AI agents 2025 2026",
    "Indian SME digital transformation challenges gaps opportunities",
    "AI agents autonomous business automation market growth India",
]

CFO_MASTER_PROMPT = """You are the Chief Future Officer of Botivate. Today's date: {today}.

Generate a comprehensive MASTER STRATEGIC INTELLIGENCE REPORT for Botivate leadership.
This report will be automatically delivered every morning to the founding team.

BOTIVATE COMPANY CONTEXT:
{company_context}

WEB RESEARCH FINDINGS (current market intelligence):
{web_research}

Generate a detailed report covering ALL of the following sections.
Be extremely specific, use real numbers, real competitor names, real product names.
Write like a McKinsey partner who knows Botivate inside-out.

---

## EXECUTIVE SUMMARY
3-4 sentences. Most critical thing Botivate must act on TODAY.

---

## 1. NEXT PRODUCTS TO BUILD
For each product: Name | Market Size | Target Buyer | Why Now | Revenue Potential
List the top 5 products Botivate should build next based on market demand.

---

## 2. NEXT IMPROVEMENTS — CURRENT PRODUCT STACK
Top 10 specific improvements needed in AutoRocket right now.
For each: What to improve | Why it matters | Impact if done | Risk if ignored

---

## 3. INVESTMENT PRIORITIES
Where should Botivate invest next? Rank by ROI:
Technology | Team | Marketing | Infrastructure | Partnerships
For each: Amount range | Expected return | Timeline

---

## 4. DEPARTMENT FOCUS — WHERE TO PUT ENERGY NOW
Which department needs the most attention: Sales / Engineering / Product / Customer Success / Marketing / HR?
Why? What specifically should they do? What happens if ignored?

---

## 5. GO-TO-MARKET STRATEGIES
Top 5 strategies for next 12 months. For each:
Strategy | Target segment | Action steps | Expected outcome | Owner

---

## 6. FUTURE IMPACT — 3-YEAR OUTLOOK
If Botivate executes correctly:
- Revenue projection (6M / 12M / 24M / 36M)
- Customer count
- Team size
- Market position
- Valuation estimate

---

## 7. WHAT IS HAPPENING IN MARKET THAT BOTIVATE IS MISSING
7 major market movements Botivate is NOT participating in.
For each: What is happening | How big is it | What Botivate should do | Urgency level

---

## 8. WHAT COMPETITORS ARE DOING THAT BOTIVATE IS NOT
Analyze: Zoho, Tally, SAP Business One, Odoo, ERPNext, Vyapar, Salesforce
For each competitor: What they launched recently | What Botivate is missing | How to respond

---

## 9. BOTIVATE'S LIMITATIONS — HONEST ASSESSMENT
Top 8 limitations holding Botivate back. Be brutally honest.
For each: The limitation | Root cause | Business impact | How to fix it

---

## 10. GAP ANALYSIS — BOTIVATE VS MARKET VS COMPETITORS
Quantify the gap in: Product depth | Mobile | Security/Compliance | Channel | Brand | AI capability | Pricing

---

## 11. HOW TO SOLVE AND BECOME THE BEST
For the top 5 gaps: Exact solution | Steps | Timeline | Owner | Expected outcome

---

## 12. WHY BOTIVATE MUST ACT NOW
For each major recommendation: Business case | Revenue at stake | Risk of waiting | Competitive window

---

## 13. BOTIVATE KA FUTURE — IF EXECUTED
Month 6: What will be different
Month 12: Where will Botivate stand
Month 24: Market position
Month 36: Category leadership scenario

---

## 14. 90-DAY ACTION PLAN
Week 1-2: Immediate actions (quick wins)
Week 3-4: Short term moves
Month 2: Key milestones
Month 3: End state — what should be true by Day 90

---

End with a ONE-LINE VERDICT: The single most important thing Botivate must do this week.
"""


async def run_strategic_cfo_analysis() -> dict:
    """
    Full 14-point CFO strategic analysis.
    Searches multiple market queries then generates the master report.
    """
    # Gather web research across multiple strategic queries
    all_web_results = []
    all_sources = []
    for query in CFO_STRATEGIC_QUERIES:
        try:
            results = search_tool.invoke(query)
            if isinstance(results, list):
                all_web_results.extend(results[:3])
        except Exception:
            pass

    web_snippets = "\n\n".join(
        f"[Source: {r.get('url', '')}]\n{r.get('content', '')[:500]}"
        for r in all_web_results[:12]
    )

    all_sources = [
        {"url": r.get("url", ""), "title": (r.get("url", "") or "").split("/")[-1][:60]}
        for r in all_web_results if r.get("url")
    ]

    from datetime import date as _date
    today_str = _date.today().strftime("%B %d, %Y")

    prompt = CFO_MASTER_PROMPT.format(
        today=today_str,
        company_context=COMPANY_CONTEXT,
        web_research=web_snippets or "No web results available — analysis based on company knowledge.",
    )

    from langchain_core.messages import HumanMessage
    response = llm.invoke([HumanMessage(content=prompt)])

    return {
        "mode": "strategic_cfo",
        "analysis": response.content,
        "sources": all_sources[:12],
    }
