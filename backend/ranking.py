import re
import numpy as np
from typing import List
from models import SearchItem
from search import MemorySearchEngine
import load_env

engine = MemorySearchEngine()      # for embeddings
embed = engine.embed               # shortcut


# Provider scoring power
PROVIDER_WEIGHTS = {
    "exa": 1.30,
    "brave": 1.00,
    "serpapi": 0.90,   # added new provider
    # any future provider will default to 0.8
}


def cosine_sim(a, b):
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def keyword_overlap(query: str, text: str) -> float:
    q = set(re.findall(r"\w+", query.lower()))
    t = set(re.findall(r"\w+", text.lower()))
    if not q:
        return 0.0
    return len(q & t) / len(q)


def dedupe(items: List[SearchItem]) -> List[SearchItem]:
    """
    Keep the BEST version of each URL after ranking.
    """
    by_url = {}

    for item in items:
        key = item.url.split("?")[0].lower().strip()

        if key not in by_url:
            by_url[key] = item
        else:
            # keep the one with longer text (higher chance of richer info)
            if len(item.text) > len(by_url[key].text):
                by_url[key] = item

    return list(by_url.values())


def dedupe_and_rank(query: str, items: List[SearchItem], limit: int) -> List[SearchItem]:

    # Step 1 — Deduplicate first pass
    unique_items = dedupe(items)

    if not unique_items:
        return []

    # Step 2 — Embed the query once
    q_vec = embed(query)

    ranked = []

    for item in unique_items:
        text = f"{item.title}\n{item.text}"
        t_vec = embed(text)

        semantic = cosine_sim(q_vec, t_vec)
        keyword = keyword_overlap(query, text)
        provider_weight = PROVIDER_WEIGHTS.get(item.provider.lower(), 0.8)

        final_score = (
            0.55 * semantic +
            0.25 * keyword +
            0.20 * provider_weight
        )

        item.final_score = final_score
        item.semantic_score = semantic
        item.keyword_score = keyword

        ranked.append(item)

    # Step 3 — Sort
    ranked = sorted(ranked, key=lambda x: x.final_score, reverse=True)

    # Step 4 — Final dedupe (preserve highest scoring)
    ranked = dedupe(ranked)

    return ranked[:limit]
