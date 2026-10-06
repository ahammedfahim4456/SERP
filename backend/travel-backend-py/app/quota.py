from datetime import date

THIRTY_FIVE_DAYS = 35 * 24 * 3600


class QuotaExceeded(Exception):
    pass


class QuotaGuard:
    """Monthly counter so we stop before burning through SerpApi credits."""

    def __init__(self, cache, limit: int) -> None:
        self._cache = cache
        self._limit = limit

    def _key(self) -> str:
        return f"quota:serpapi:{date.today():%Y-%m}"

    async def used(self) -> int:
        return int(await self._cache.get(self._key()) or 0)

    async def ensure_available(self) -> None:
        if await self.used() >= self._limit:
            raise QuotaExceeded(f"Monthly SerpApi quota reached ({self._limit})")

    async def record_call(self) -> None:
        await self._cache.incr(self._key(), THIRTY_FIVE_DAYS)
