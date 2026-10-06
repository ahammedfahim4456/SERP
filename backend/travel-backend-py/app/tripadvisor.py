import logging
from datetime import datetime, timezone

from .quota import QuotaGuard
from .schemas import TripadvisorRecommendation, TripadvisorSearchResponse
from .serpapi_client import SerpApiClient

log = logging.getLogger("tripadvisor")


class TripadvisorService:
    def __init__(self, client: SerpApiClient, cache, quota: QuotaGuard, ttl_seconds: int) -> None:
        self.client = client
        self.cache = cache
        self.quota = quota
        self.ttl_seconds = ttl_seconds

    async def recommend(self, destination: str, budget: int | None = None) -> TripadvisorSearchResponse:
        destination = " ".join(destination.strip().split())
        query = f"best things to do in {destination}"
        key = f"tripadvisor:{destination.lower()}:{budget or 'all'}"

        hit = await self.cache.get(key)
        if hit:
            try:
                log.info("cache HIT %s", key)
                return TripadvisorSearchResponse.model_validate_json(hit).model_copy(update={"cached": True})
            except ValueError:
                log.warning("bad cache entry for %s, refetching", key)

        log.info("cache MISS %s", key)
        await self.quota.ensure_available()
        raw = await self.client.tripadvisor(query, ssrc="a")
        await self.quota.record_call()

        recs = self.parse(raw)
        response = TripadvisorSearchResponse(
            cached=False,
            fetched_at=datetime.now(timezone.utc),
            destination=destination,
            recommendations=recs,
        )
        await self.cache.set(key, response.model_dump_json(), self.ttl_seconds)
        return response

    @staticmethod
    def parse(raw: dict) -> list[TripadvisorRecommendation]:
        recs = []
        for p in raw.get("place_results") or raw.get("places") or []:
            title = p.get("title")
            if not title:
                continue
            thumb = p.get("thumbnail")
            thumb_url = thumb.get("link") if isinstance(thumb, dict) else (thumb if isinstance(thumb, str) else None)
            recs.append(TripadvisorRecommendation(
                title=title,
                category=p.get("type") or p.get("category"),
                description=p.get("description"),
                location=p.get("location"),
                thumbnail_url=thumb_url,
                link=p.get("link"),
                rating=p.get("rating"),
                review_count=p.get("reviews"),
            ))
        return recs
