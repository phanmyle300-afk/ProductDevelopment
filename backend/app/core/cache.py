import json
import time
from typing import Any, Dict, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False


class AnalyticsCacheService:
    """
    High-performance Cache for Heavy Analytics Queries & Aggregations.
    Uses Redis when reachable with seamless in-memory fallback.
    """

    def __init__(self):
        self._memory_cache: Dict[str, Tuple[Any, float]] = {}
        self._redis_client: Optional[Any] = None
        self._redis_tested = False

    async def _get_redis(self) -> Optional[Any]:
        if not HAS_REDIS:
            return None
        if self._redis_client is not None:
            return self._redis_client
        if not self._redis_tested:
            try:
                client = aioredis.from_url(settings.redis_url, decode_responses=True)
                await client.ping()
                self._redis_client = client
                logger.info("Analytics cache: connected to Redis backend")
            except Exception:
                logger.warning("Analytics cache: Redis not reachable, falling back to in-memory TTL cache")
                self._redis_client = None
            finally:
                self._redis_tested = True
        return self._redis_client

    async def get(self, key: str) -> Optional[Any]:
        """Fetch item from cache. Returns None if missed or expired."""
        redis = await self._get_redis()
        if redis:
            try:
                val = await redis.get(key)
                if val is not None:
                    return json.loads(val)
            except Exception as e:
                logger.warning("Redis cache get error: %s, falling back to memory", e)

        # In-memory check
        item = self._memory_cache.get(key)
        if item is not None:
            val, expiry = item
            if time.time() < expiry:
                return val
            else:
                del self._memory_cache[key]
        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Store item in cache with TTL (default 300s / 5 minutes)."""
        redis = await self._get_redis()
        if redis:
            try:
                await redis.set(key, json.dumps(value, default=str), ex=ttl_seconds)
                return
            except Exception as e:
                logger.warning("Redis cache set error: %s, caching in memory", e)

        # In-memory store
        self._memory_cache[key] = (value, time.time() + ttl_seconds)

    async def clear_prefix(self, prefix: str = "analytics:") -> None:
        """Invalidate cache entries starting with prefix."""
        redis = await self._get_redis()
        if redis:
            try:
                keys = await redis.keys(f"{prefix}*")
                if keys:
                    await redis.delete(*keys)
            except Exception as e:
                logger.warning("Redis cache clear error: %s", e)

        keys_to_del = [k for k in self._memory_cache.keys() if k.startswith(prefix)]
        for k in keys_to_del:
            del self._memory_cache[k]


cache_service = AnalyticsCacheService()
