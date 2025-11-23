# backend/app.py

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

import load_env   # <-- load all environment keys

from reasoner import run_reasoning_layer
from search import MemorySearchEngine
from orchestrator import orchestrator   # <-- already includes all providers
from llm import normalize_query_with_llm
from models import SearchItem


app = FastAPI()


# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Request Model ----------------
class SearchRequest(BaseModel):
    query: str
    domains: Optional[List[str]] = None
    num_results: int = 10
    use_llm: bool = False


# ---------------- Search Endpoint ----------------
@app.post("/search")
async def search(req: SearchRequest):

    effective_query = req.query
    llm_debug = None

    # ---- Optional LLM Query Normalization ----
    if req.use_llm:
        try:
            normalized, debug = normalize_query_with_llm(req.query, req.domains)
            if normalized.strip():
                effective_query = normalized.strip()
            llm_debug = debug
        except Exception as e:
            llm_debug = f"LLM normalization failed: {e}"

    # ---- Run orchestrator over all providers ----
    final_results: List[SearchItem] = orchestrator.search(
        query=effective_query,
        domains=req.domains,
        num_results=req.num_results
    )

    # ---- LLM Reasoning (Gemini) ----
    ai_analysis = run_reasoning_layer(effective_query, final_results)

    # ---- Final Response ----
    return {
        "results": [r.dict() for r in final_results],
        "answer": ai_analysis["summary"],
        "citations": ai_analysis["citations"],
        "effective_query": effective_query,
        "providers_used": list({r.provider for r in final_results}),
        "llm_used": req.use_llm,
        "llm_debug": llm_debug
    }
