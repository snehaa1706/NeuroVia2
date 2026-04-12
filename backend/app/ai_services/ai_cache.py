"""
NeuroVia AI Result Caching — Phase 10
Hash-based in-memory cache with TTL expiration.
Thread-safe, keyed by sha256 of input data.
"""

import hashlib
import json
import logging
import threading
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


class AICache:
    """Thread-safe in-memory cache with TTL expiration for AI results."""

    def __init__(self, max_size: int = 256, ttl_seconds: int = 600):
        self._cache: dict[str, dict] = {}
        self._lock = threading.Lock()
        self._max_size = max_size
        self._ttl = ttl_seconds

    @staticmethod
    def _make_key(data: Any) -> str:
        """Create a deterministic cache key from input data."""
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def get(self, data: Any) -> Optional[Any]:
        """Retrieve a cached result if it exists and hasn't expired."""
        key = self._make_key(data)
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            if time.time() - entry["timestamp"] > self._ttl:
                del self._cache[key]
                logger.debug(f"[AICache] expired key={key[:12]}...")
                return None
            logger.info(f"[AICache] hit key={key[:12]}...")
            return entry["value"]

    def set(self, data: Any, value: Any) -> None:
        """Store a result in the cache."""
        key = self._make_key(data)
        with self._lock:
            # Evict oldest entries if at capacity
            if len(self._cache) >= self._max_size:
                oldest_key = min(self._cache, key=lambda k: self._cache[k]["timestamp"])
                del self._cache[oldest_key]
                logger.debug(f"[AICache] evicted oldest key={oldest_key[:12]}...")

            self._cache[key] = {
                "value": value,
                "timestamp": time.time(),
            }
            logger.debug(f"[AICache] stored key={key[:12]}...")

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._cache.clear()
            logger.info("[AICache] cleared all entries")

    def stats(self) -> dict:
        """Return cache statistics."""
        with self._lock:
            now = time.time()
            active = sum(1 for e in self._cache.values() if now - e["timestamp"] <= self._ttl)
            return {
                "total_entries": len(self._cache),
                "active_entries": active,
                "max_size": self._max_size,
                "ttl_seconds": self._ttl,
            }


# Global singleton
ai_cache = AICache()
