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
