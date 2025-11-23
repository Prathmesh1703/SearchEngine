import os
import requests
from providers.base import SearchProvider
from models import SearchItem

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

if not SERPAPI_KEY:
    raise RuntimeError("Missing SERPAPI_KEY for SerpAPIProvider")

class SerpAPIProvider(SearchProvider):
    name = "serpapi"

    def search(self, query, domains=None, num_results=10):

        params = {
            "engine": "google",
            "q": query,
            "api_key": SERPAPI_KEY,
            "num": num_results
        }

        response = requests.get("https://serpapi.com/search", params=params).json()

        results = []
        for item in response.get("organic_results", []):
            results.append(
                SearchItem(
                    title=item.get("title", ""),
                    url=item.get("link", ""),
                    text=item.get("snippet", ""),
                    provider=self.name,
                    score=1.0
                )
            )

        # ------- Domain Filtering -------
        if domains:
            filtered = []
            for r in results:
                for d in domains:
                    clean_d = d.replace("https://", "").replace("http://", "").replace("www.", "")
                    if clean_d in r.url:
                        filtered.append(r)
                        break
            results = filtered
        # --------------------------------

        return results
