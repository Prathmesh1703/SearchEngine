# backend/app.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from dotenv import load_dotenv
import os

from search import MemorySearchEngine

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
    results = engine.search(query=req.query, domains=req.domains, num_results=req.num_results)
    return {"results": results}


@app.get("/")
def root():
    return {"message": "Memory Search Engine (EXA-powered) is running!"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
