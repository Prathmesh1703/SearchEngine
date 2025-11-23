import os
import json
import time
import faiss
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple

BASE_DIR = Path(__file__).resolve().parent
INDEX_PATH = BASE_DIR / "faiss_index.bin"
MEMORY_PATH = BASE_DIR / "memory.json"

EMBED_DIM = 384   # all-MiniLM-L6-v2 output size

# -------------------------
# Load / Initialize FAISS
# -------------------------
if INDEX_PATH.exists():
    index = faiss.read_index(str(INDEX_PATH))
else:
    index = faiss.IndexFlatL2(EMBED_DIM)

# -------------------------
# Load / Initialize JSON metadata
# -------------------------
if MEMORY_PATH.exists():
    with open(MEMORY_PATH, "r", encoding="utf-8") as f:
        memory: Dict[str, Any] = json.load(f)
else:
    memory = {}

# -------------------------
# Save functions
# -------------------------
def save_index():
    faiss.write_index(index, str(INDEX_PATH))

def save_memory():
    with open(MEMORY_PATH, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2)

# -------------------------
# Add new vector to memory
# -------------------------
def add_memory_item(vector: np.ndarray, metadata: Dict[str, Any]) -> int:
    """
    Adds a vector + metadata to memory. Returns FAISS ID.
    """
    global memory, index

    if vector.shape != (EMBED_DIM,):
        raise ValueError(f"Expected vector shape {(EMBED_DIM,)}, got {vector.shape}")

    faiss_id = index.ntotal
    index.add(np.array([vector]).astype("float32"))

    metadata["timestamp"] = int(time.time())
    memory[str(faiss_id)] = metadata

    save_index()
    save_memory()

    return faiss_id

# -------------------------
# Search top-K from memory
# -------------------------
def search_memory(query_vec: np.ndarray, top_k: int = 5) -> List[Tuple[int, float, Dict]]:
    """
    Returns list of (faiss_id, distance, metadata)
    """
    if index.ntotal == 0:
        return []

    query_vec = np.array([query_vec]).astype("float32")

    distances, idxs = index.search(query_vec, top_k)

    results = []
    for dist, idx in zip(distances[0], idxs[0]):
        if idx == -1:
            continue
        if str(idx) in memory:
            results.append((idx, float(dist), memory[str(idx)]))

    return results
