import logging
import re
from datetime import datetime, timezone

from .normalizer import normalize_location
from .quota import QuotaGuard
from .schemas import TransitLeg, TransitOption, TransitSearchResponse
from .serpapi_client import SerpApiClient

log = logging.getLogger("transit")

_NUMBER_PREFIX = re.compile(r"^(\d{3,6})\s*-\s*")


def _mode_from_icon(icon: str | None) -> str:
    name = (icon or "").rsplit("/", 1)[-1].lower()
    if "rail" in name or "train" in name:
        return "train"
    if "bus" in name:
        return "bus"
    if "metro" in name or "subway" in name:
        return "metro"
    return "other"


def _minutes(seconds) -> int:
    return round((seconds or 0) / 60)


class TransitService:
    def __init__(self, client: SerpApiClient, cache, quota: QuotaGuard, ttl_seconds: int) -> None:
        self.client = client
        self.cache = cache
        self.quota = quota
        self.ttl_seconds = ttl_seconds

    async def search(self, origin: str, destination: str) -> TransitSearchResponse:
        origin, destination = origin.strip(), destination.strip()
        norm_orig = normalize_location(origin)
        norm_dest = normalize_location(destination)
        if norm_orig.canonical_id == norm_dest.canonical_id:
            raise ValueError("origin and destination must be different")

        key = f"transit:{norm_orig.canonical_id}|{norm_dest.canonical_id}"

        hit = await self.cache.get(key)
        if hit:
            try:
                log.info("cache HIT %s", key)
                return TransitSearchResponse.model_validate_json(hit).model_copy(update={"cached": True})
            except ValueError:
                log.warning("bad cache entry for %s, refetching", key)

        log.info("cache MISS %s", key)
        await self.quota.ensure_available()
        raw = await self.client.google_maps_transit(origin, destination)
        await self.quota.record_call()

        response = TransitSearchResponse(
            cached=False, fetched_at=datetime.now(timezone.utc),
            origin=origin, destination=destination, options=self.parse(raw))
        await self.cache.set(key, response.model_dump_json(), self.ttl_seconds)
        return response

    @staticmethod
    def parse(raw: dict) -> list[TransitOption]:
        options = []
        for d in raw.get("directions") or []:
            if d.get("travel_mode") != "Transit":
                continue
            legs, walking = [], 0
            for t in d.get("trips") or []:
                if t.get("travel_mode") != "Transit":
                    walking += _minutes(t.get("duration"))
                    continue
                start, end = t.get("start_stop") or {}, t.get("end_stop") or {}
                title = t.get("title") or ""
                m = _NUMBER_PREFIX.match(title)
                legs.append(TransitLeg(
                    mode=_mode_from_icon(t.get("icon")),
                    title=title,
                    service_number=m.group(1) if m else None,
                    operator=(t.get("service_run_by") or {}).get("name"),
                    from_name=start.get("name"), from_code=start.get("stop_id"),
                    departure_time=start.get("time"),
                    to_name=end.get("name"), to_code=end.get("stop_id"),
                    arrival_time=end.get("time"),
                    duration_minutes=_minutes(t.get("duration")),
                    intermediate_stops=len(t.get("stops") or []),
                ))
            if not legs:
                continue
            longest = max(legs, key=lambda leg: leg.duration_minutes)
            options.append(TransitOption(
                departure_time=d.get("start_time"), arrival_time=d.get("end_time"),
                duration_minutes=_minutes(d.get("duration")), walking_minutes=walking,
                fare=d.get("cost"), currency=d.get("currency"),
                main_mode=longest.mode, legs=legs))
        return options
