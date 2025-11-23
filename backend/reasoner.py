import os
import json
from typing import List, Dict, Any
import load_env

import google.generativeai as genai

from models import SearchItem
from orchestrator import orchestrator  # use your existing orchestrator for extra searches

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in environment")

genai.configure(api_key=GEMINI_API_KEY)

# ---------------- SYSTEM PROMPTS ----------------

BASE_SYSTEM_PROMPT = """
You are a reasoning engine for an AI meta-search system.

You receive:
- The user's query.
- A set of search results from multiple providers.

You must think step-by-step and help decide:
1) Whether we need extra searches.
2) What refined sub-queries we should ask.
3) How confident you are that we already have enough information.

You MUST follow the requested JSON schema exactly when asked.
"""

SYNTHESIS_SYSTEM_PROMPT = """
You are an AI answer composer for a multi-provider search engine.

You take raw search results and produce:
- A clear final answer.
- Short bullet-point summary.
- Citations to sources in [1], [2], ... form.

Rules:
- Use only the provided results as your knowledge.
- Keep answer factual and grounded.
- Do NOT invent URLs or sources.
- Keep the main answer under ~200 words unless clearly needed.
- After the answer, add a section "What this means" in 2–4 bullet points.
"""


MAX_AGENT_STEPS = 2  # medium-depth agent


# ---------------- HELPER: decide when to use agentic mode ----------------

def should_use_agentic(query: str, results: List[SearchItem]) -> bool:
  q = query.lower().strip()
  tokens = q.split()

  # Complex / analytical queries
  question_starts = ("why", "how", "what", "explain", "compare", "analyse", "analyze", "summarize", "summary")
  if tokens and tokens[0] in question_starts:
      return True

  # Explicit question-mark queries
  if "?" in q:
      return True

  # Longer queries often require reasoning
  if len(tokens) >= 8:
      return True

  # Very few results -> maybe need deeper search
  if len(results) < 3:
      return True

  return False


# ---------------- HELPER: build context text from results ----------------

def build_results_context(results: List[SearchItem]) -> str:
  blocks = []
  for i, item in enumerate(results, 1):
      blocks.append(f"""
[{i}]
Title: {item.title}
URL: {item.url}
Provider: {item.provider}
Text: { (item.text or '')[:600] }
""")
  return "\n".join(blocks)


# ---------------- AGENT PLANNING CALL ----------------

def call_planner(query: str, results: List[SearchItem]) -> Dict[str, Any]:
  """
  Ask Gemini: do we need more searches, and if yes, which subqueries?
  Returns a Python dict with:
  {
    "need_more_search": bool,
    "subqueries": [str],
    "confidence": float
  }
  """
  context_text = build_results_context(results)

  user_prompt = f"""
User Query:
{query}

CURRENT RESULTS:
{context_text}

TASK:
Decide if we need another round of search.

Return ONLY valid JSON (no explanation), with the exact schema:
{{
  "need_more_search": true or false,
  "subqueries": ["optional refined search 1", "optional refined search 2"],
  "confidence": a number between 0 and 1
}}

Guidelines:
- If the results clearly answer the question, set need_more_search = false.
- If the user is asking for explanation, comparison, or deep context and results look thin or noisy, set need_more_search = true.
- Subqueries should be short and precise.
"""

  model = genai.GenerativeModel("gemini-2.5-flash")

  try:
      resp = model.generate_content(
          BASE_SYSTEM_PROMPT + "\n\n" + user_prompt,
          generation_config={"temperature": 0.2, "max_output_tokens": 200}
      )
      raw = resp.text.strip()

      # Attempt to parse JSON
      # Gemini may wrap JSON in ```json ... ```
      if raw.startswith("```"):
          raw = raw.strip("`")
          # remove possible json\n prefix
          raw = raw.replace("json\n", "").replace("json\r\n", "")

      plan = json.loads(raw)
      # Basic shape guard
      if not isinstance(plan, dict):
          raise ValueError("Planner JSON is not an object")

      # Normalize fields
      need_more = bool(plan.get("need_more_search", False))
      subqueries = plan.get("subqueries") or []
      if not isinstance(subqueries, list):
          subqueries = []
      subqueries = [str(s) for s in subqueries][:3]  # cap to 3
      confidence = float(plan.get("confidence", 0.6))

      return {
          "need_more_search": need_more,
          "subqueries": subqueries,
          "confidence": confidence
      }

  except Exception as e:
      # On failure, just say no more search
      return {
          "need_more_search": False,
          "subqueries": [],
          "confidence": 0.5,
          "error": f"planner_failed: {e!r}"
      }


# ---------------- FINAL SYNTHESIS CALL ----------------

def call_synthesis(query: str, results: List[SearchItem]) -> Dict[str, Any]:
  """
  Compose final answer + citations from the pool of results.
  Returns:
  {
    "summary": str,
    "citations": [{ "index": int, "url": str }]
  }
  """

  if not results:
      return {
          "summary": "No sources returned relevant information.",
          "citations": []
      }

  context_text = build_results_context(results)

  user_prompt = f"""
User Query:
{query}

SOURCES:
{context_text}

Write a final answer that:
- Directly answers the query first.
- Then adds a short "What this means" section in bullet points.
- Uses citations like [1], [2], ... matching the numbered sources.
"""

  model = genai.GenerativeModel("gemini-2.5-flash")

  try:
      resp = model.generate_content(
          SYNTHESIS_SYSTEM_PROMPT + "\n\n" + user_prompt,
          generation_config={"temperature": 0.2, "max_output_tokens": 400}
      )
      summary = resp.text.strip()
  except Exception as e:
      summary = f"AI synthesis failed. Showing raw results instead.\n\nError: {e!r}"

  # Build citations map
  citations = [
      {"index": i, "url": item.url}
      for i, item in enumerate(results, 1)
  ]

  return {
      "summary": summary,
      "citations": citations
  }


# ---------------- PUBLIC ENTRYPOINT ----------------

def run_reasoning_layer(query: str, initial_results: List[SearchItem]) -> Dict[str, Any]:
  """
  Main reasoning entrypoint.

  - Automatically decides whether to run multi-step agentic search
    (up to MAX_AGENT_STEPS) based on query + initial results.
  - Always returns:
      {
        "summary": str,
        "citations": [{ "index": int, "url": str }]
      }
  """

  # If no results at all, just synthesize a fallback
  if not initial_results:
      return {
          "summary": "No results were found for this query.",
          "citations": []
      }

  use_agent = should_use_agentic(query, initial_results)

  # If we decide it's simple enough, just do one-shot synthesis.
  if not use_agent:
      return call_synthesis(query, initial_results)

  # Agentic mode: up to 2 steps
  all_results: List[SearchItem] = list(initial_results)

  for step in range(MAX_AGENT_STEPS):
      plan = call_planner(query, all_results)

      need_more = plan.get("need_more_search", False)
      subqueries = plan.get("subqueries", [])
      confidence = float(plan.get("confidence", 0.0))

      # If plan says no more search, or we are confident enough -> stop
      if not need_more or confidence >= 0.8:
          break

      # If no subqueries given, nothing else to do
      if not subqueries:
          break

      # Execute subqueries via orchestrator
      new_results: List[SearchItem] = []
      for sq in subqueries:
          try:
              extra = orchestrator.search(
                  query=sq,
                  domains=None,
                  num_results=5
              )
              new_results.extend(extra)
          except Exception as e:
              print(f"[agent] extra search failed for {sq!r}: {e}")

      if not new_results:
          break

      # Merge new results with existing ones, dedupe by URL
      seen_urls = set(r.url for r in all_results)
      for r in new_results:
          if r.url not in seen_urls:
              all_results.append(r)
              seen_urls.add(r.url)

  # Final synthesis over the enriched result set
  return call_synthesis(query, all_results)
