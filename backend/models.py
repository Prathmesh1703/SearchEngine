# backend/models.py
from typing import Optional
from pydantic import BaseModel

class SearchItem(BaseModel):
    title: str
    url: str
    text: str

    # Provider & metadata
    provider: str              # "exa", "serpapi", "brave", etc.
    provider_score: float = 0.0      # raw score from provider if available

    # Optional fields
    published_at: Optional[str] = None
    author: Optional[str] = None

    # Computed scores
    semantic_score: Optional[float] = None
    keyword_score: Optional[float] = None
    recency_score: Optional[float] = None
    source_weight: Optional[float] = None
    final_score: Optional[float] = None
