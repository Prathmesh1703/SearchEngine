# backend/providers/exa_provider.py

from typing import List, Optional
from models import SearchItem
from .base import SearchProvider
import load_env  # ensures EXA_API_KEY loads
import os
from exa_py import Exa


class ExaProvider(SearchProvider):
    name = "exa"

    def __init__(self):
        api_key = os.getenv("EXA_API_KEY")
        if not api_key:
            raise RuntimeError("EXA_API_KEY missing in environment")

        self.client = Exa(api_key)

    def search(self, query: str, domains: Optional[list], num_results: int) -> List[SearchItem]:
        # Call the real EXA API
        response = self.client.search(
            query,
            num_results=num_results,
            type="keyword",
            include_domains=domains if domains else None
        )

        results = []
        for r in response.results:
            results.append(
                SearchItem(
                    title=r.title or "",
                    url=r.url,
                    text=r.text or "",
                    provider=self.name,
                    provider_score=r.score if hasattr(r, "score") else 1.0
                )
            )

        return results
