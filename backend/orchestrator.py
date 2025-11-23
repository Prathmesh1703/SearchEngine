from typing import List, Optional
from models import SearchItem
from ranking import dedupe_and_rank
from cache import make_key, get_cache, set_cache
import load_env

# Vector memory
from vector_memory.vector_store import add_memory_item, search_memory
from search import MemorySearchEngine

# Providers
from providers.base import SearchProvider
from providers.exa_provider import ExaProvider
from providers.serpapi_provider import SerpAPIProvider


class SearchOrchestrator:
    def __init__(self, providers: List[SearchProvider]):
        self.providers = providers
        self.embedder = MemorySearchEngine()   # reuse embedding model

    def search(self, query: str, domains: Optional[list], num_results: int) -> List[SearchItem]:

        # --------------- CACHE CHECK ---------------
        cache_key = make_key("orchestrator", query, domains, num_results, False)
        cached = get_cache(cache_key)
        if cached:
            return [SearchItem(**item) for item in cached["results"]]
        # --------------------------------------------

        # --------------- MEMORY VECTOR SEARCH ---------------
        query_vec = self.embedder.embed(query)
        memory_hits = search_memory(query_vec, top_k=5)

        if memory_hits:
            mem_items = []
            for faiss_id, dist, meta in memory_hits:
                mem_items.append(
                    SearchItem(
                        title=meta.get("title", ""),
                        url=meta.get("url", ""),
                        text=meta.get("text", ""),
                        provider="memory",
                        score=1 / (1 + dist)
                    )
                )
            return mem_items[:num_results]
        # ---------------------------------------------------

        # --------------- MULTI-PROVIDER SEARCH ---------------
        all_results: List[SearchItem] = []

        for provider in self.providers:
            try:
                results = provider.search(query, domains, num_results)
                all_results.extend(results)
            except Exception as e:
                print(f"Provider {provider.name} failed: {e}")
        # ----------------------------------------------------

        # --------------- RANKING ---------------
        final_results = dedupe_and_rank(query, all_results, num_results)
        # ---------------------------------------

        # --------------- SAVE TO MEMORY ---------------
        for item in final_results:
            emb_text = item.text or item.title or ""
            vec = self.embedder.embed(emb_text)
            add_memory_item(vec, {
                "title": item.title,
                "url": item.url,
                "provider": item.provider,
                "text": item.text,
            })
        # -----------------------------------------------

        # --------------- WRITE CACHE ---------------
        set_cache(cache_key, {
            "results": [r.dict() for r in final_results]
        }, ttl_seconds=6 * 3600)
        # ------------------------------------------

        return final_results


# ---- Instantiate Providers & Orchestrator ----
exa = ExaProvider()
serp = SerpAPIProvider()

orchestrator = SearchOrchestrator(
    providers=[exa, serp]
)
