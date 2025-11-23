import os
import load_env
from cache import make_key, get_cache, set_cache
from typing import List, Tuple, Optional
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not os.getenv("GEMINI_API_KEY"):
    raise RuntimeError("Missing GEMINI_API_KEY in environment")

# Configure Gemini client
genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """
You are a search-query optimizer for a semantic social media memory search engine.

Platforms: X (Twitter), TikTok, Reddit, Instagram, YouTube, Threads.

Your job:
- Rewrite vague or messy queries into *optimized* search queries.
- Keep under 20–25 words.
- Do NOT answer the question; only rewrite.
- Add helpful missing context if implied (e.g., topic, sport, year).
- Do NOT add quotes.
- Do NOT add hashtags unless essential.
- Output ONLY the rewritten query in plain text.
"""


def build_domains_hint(domains: Optional[List[str]]) -> str:
    if not domains:
        return "all platforms"
    cleaned = [d.replace("https://", "").replace("http://", "").replace("www.", "") for d in domains]
    return ", ".join(cleaned)


def normalize_query_with_llm(original_query: str, domains: Optional[List[str]] = None) -> Tuple[str, str]:
    """
    Returns (normalized_query, debug_explanation)
    """

    # ---------- CACHE CHECK ----------
    cache_key = make_key("llm_norm", original_query, domains, 0, False)
    cached = get_cache(cache_key)
    if cached:
        return cached["normalized"], cached["debug"]
    # ---------------------------------

    model = genai.GenerativeModel("gemini-2.5-flash")
    domains_hint = build_domains_hint(domains)

    user_prompt = f"""
User Query: {original_query}
Selected Platforms: {domains_hint}

Rewrite this into an optimized search query ONLY.
"""

    try:
        response = model.generate_content(
            SYSTEM_PROMPT + "\n\n" + user_prompt,
            generation_config={"temperature": 0.2, "max_output_tokens": 40}
        )

        normalized = response.text.strip()

        if not normalized:
            normalized = original_query

        debug_info = (
            f"original_query={original_query!r}, "
            f"domains_hint={domains_hint!r}, "
            f"normalized_query={normalized!r}"
        )

        # ---------- WRITE TO CACHE ----------
        set_cache(cache_key, {
            "normalized": normalized,
            "debug": debug_info
        }, ttl_seconds=6 * 3600)
        # ------------------------------------

        return normalized, debug_info

    except Exception as e:
        return original_query, f"Gemini normalization failed: {e!r}"

