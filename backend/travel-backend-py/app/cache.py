import logging
import time

import redis.asyncio as redis

log = logging.getLogger("cache")


class MemoryCache:
    """Fallback cache for local dev. Resets on restart and is not shared between processes."""

    def __init__(self) -> None:
        self._data: dict[str, tuple[str, float | None]] = {}

    async def get(self, key: str) -> str | None:
        item = self._data.get(key)
        if item is None:
            return None
        value, expires_at = item
        if expires_at is not None and expires_at < time.time():
            del self._data[key]
            return None
        return value

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        self._data[key] = (value, time.time() + ttl_seconds)

    async def incr(self, key: str, ttl_seconds: int) -> int:
        item = self._data.get(key)
        if item is None or (item[1] is not None and item[1] < time.time()):
            self._data[key] = ("1", time.time() + ttl_seconds)
            return 1
        value, expires_at = item
        n = int(value) + 1
        self._data[key] = (str(n), expires_at)
        return n

    async def close(self) -> None:
        pass


class RedisCache:
    def __init__(self, client: redis.Redis) -> None:
        self._r = client

    async def get(self, key: str) -> str | None:
        return await self._r.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        await self._r.set(key, value, ex=ttl_seconds)

    async def incr(self, key: str, ttl_seconds: int) -> int:
        n = await self._r.incr(key)
        if n == 1:
            await self._r.expire(key, ttl_seconds)
        return n

    async def close(self) -> None:
        await self._r.aclose()


async def build_cache(redis_url: str | None):
    if not redis_url:
        log.warning("REDIS_URL not set: using in-memory cache (resets on restart)")
        return MemoryCache()
    client = redis.from_url(redis_url, decode_responses=True)
    await client.ping()  # fail fast with a clear error if Redis is unreachable
    log.info("Connected to Redis")
    return RedisCache(client)
