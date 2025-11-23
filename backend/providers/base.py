# backend/providers/base.py
from typing import List, Optional
from abc import ABC, abstractmethod
from models import SearchItem

class SearchProvider(ABC):
    name: str  # used to set SearchItem.provider

    @abstractmethod
    def search(self, query: str, domains: Optional[list], num_results: int) -> List[SearchItem]:
        ...
