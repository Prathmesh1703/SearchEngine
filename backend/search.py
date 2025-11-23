# backend/search.py

import os
import re
from typing import List
import load_env

from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from exa_py import Exa
from sentence_transformers import SentenceTransformer
import numpy as np


class MemorySearchEngine:
    def __init__(self):
        # Load EXA API Key
        self.api_key = os.getenv("EXA_API_KEY")
        if not self.api_key:
            raise ValueError("Missing EXA_API_KEY in environment!")

        # Initialize EXA client
        self.exa = Exa(self.api_key)

        # Load embedding model
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def embed(self, text: str):
        return self.model.encode([text], convert_to_numpy=True)[0]

    def cosine_sim(self, a, b):
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    def keyword_overlap(self, query: str, text: str) -> float:
        query_words = set(re.findall(r"\w+", query.lower()))
        text_words = set(re.findall(r"\w+", text.lower()))
        if not query_words:
            return 0.0
        return len(query_words & text_words) / len(query_words)

    def normalize_domains(self, domains: List[str]) -> List[str]:
        """
        Convert frontend domains like:
        https://x.com → x.com
        https://www.tiktok.com → tiktok.com
        https://www.reddit.com → reddit.com
        """
        normalized = []
        for d in domains:
            d = d.lower()
            d = d.replace("https://", "").replace("http://", "")
            d = d.replace("www.", "")
            d = d.strip("/")
            normalized.append(d)
        return normalized

    def domain_allowed(self, url: str, allowed_domains: List[str]) -> bool:
        """
        Ensure returned result URL matches one of the allowed domains exactly.
        """
        if not allowed_domains:
            return True

        for d in allowed_domains:
            if d in url.lower():
                return True
        return False

    def search(self, query: str, domains: List[str] = None, num_results: int = 10):
        """Perform hybrid search using EXA + semantic scoring."""

        # Normalize incoming domains for Exa
        normalized_domains = None
        if domains:
            normalized_domains = self.normalize_domains(domains)

        # Query EXA
        if normalized_domains:
            exa_results = self.exa.search(
                query,
                num_results=num_results,
                type="neural",
                include_domains=normalized_domains
            )
        else:
            exa_results = self.exa.search(
                query,
                num_results=num_results,
                type="neural"
            )

        if not exa_results.results:
            return []

        # Embed query once
        query_vec = self.embed(query)

        final_results = []

        for r in exa_results.results:
            text = r.text or ""
            title = r.title or ""
            combined_text = f"{title}\n{text}"

            # Strict post-filtering: DO NOT include if not in domain list
            if normalized_domains:
                if not self.domain_allowed(r.url, normalized_domains):
                    continue

            text_vec = self.embed(combined_text)

            semantic_score = self.cosine_sim(query_vec, text_vec)
            keyword_score = self.keyword_overlap(query, combined_text)

            final_score = 0.7 * semantic_score + 0.3 * keyword_score

            final_results.append({
                "url": r.url,
                "title": title,
                "text": text,
                "semantic_score": semantic_score,
                "keyword_score": keyword_score,
                "final_score": final_score
            })

        # Sort final results by hybrid score
        final_results = sorted(final_results, key=lambda x: x["final_score"], reverse=True)
        return final_results
