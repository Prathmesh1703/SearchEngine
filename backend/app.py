# backend/app.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from dotenv import load_dotenv
import os

from search import MemorySearchEngine
from llm import normalize_query_with_llm


# Load environment variables
load_dotenv()

app = FastAPI()
engine = MemorySearchEngine()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    domains: List[str] | None = None
    num_results: int = 10


@app.post("/search")
async def search(req: SearchRequest):
    try:
        # LLM STEP — Rewrite the query using Gemini
        effective_query = req.query
        llm_debug = None

        if req.use_llm:
            try:
                normalized, debug = normalize_query_with_llm(req.query, req.domains)

                if normalized and normalized.strip():
                    effective_query = normalized.strip()
                    llm_debug = debug

            except Exception as e:
                llm_debug = f"Gemini normalization failed: {e!r}"

        # EXA SEARCH
        results = engine.search(
            query=effective_query,
            domains=req.domains,
            num_results=req.num_results
        )

        return {
            "query_used": effective_query,
            "original_query": req.query,
            "use_llm": req.use_llm,
            "llm_debug": llm_debug,
            "results": results,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/")
def root():
    return {"message": "Memory Search Engine (EXA-powered) is running!"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
