import logging
from datetime import date, datetime, timezone

from .quota import QuotaGuard
from .schemas import FlightOption, FlightSearchResponse, Segment
from .serpapi_client import SerpApiClient

log = logging.getLogger("flights")


class FlightService:
    def __init__(self, client: SerpApiClient, cache, quota: QuotaGuard, ttl_seconds: int) -> None:
        self.client = client
        self.cache = cache
        self.quota = quota
        self.ttl_seconds = ttl_seconds

    async def search(self, origin: str, destination: str, travel_date: date,
                     return_date: date | None, adults: int, currency: str, children: int = 0) -> FlightSearchResponse:
        origin, destination, currency = origin.upper(), destination.upper(), currency.upper()

        if origin == destination:
            raise ValueError("origin and destination must be different")
        if return_date and return_date < travel_date:
            raise ValueError("returnDate must not be before date")

        key = ":".join(["flights", origin, destination, travel_date.isoformat(),
                        return_date.isoformat() if return_date else "oneway", str(adults), str(children), currency])

        # 1. cache lookup
        hit = await self.cache.get(key)
        if hit:
            try:
                log.info("cache HIT %s", key)
                resp = FlightSearchResponse.model_validate_json(hit)
                return resp.model_copy(update={"cached": True})
            except ValueError:
                log.warning("bad cache entry for %s, refetching", key)

        # 2. quota guard, then the real call
        log.info("cache MISS %s", key)
        await self.quota.ensure_available()
        raw = await self.client.google_flights(origin, destination, travel_date, return_date, adults, currency, children=children)
        await self.quota.record_call()

        # 3. normalize + store
        options = self._parse(raw.get("best_flights", []), "best", currency)
        options += self._parse(raw.get("other_flights", []), "other", currency)
        response = FlightSearchResponse(cached=False, fetched_at=datetime.now(timezone.utc),
                                        origin=origin, destination=destination, adults=adults,
                                        children=children, options=options)
        await self.cache.set(key, response.model_dump_json(), self.ttl_seconds)
        return response

    @staticmethod
    def _parse(group: list[dict], category: str, currency: str) -> list[FlightOption]:
        out = []
        for f in group:
            segs = [
                Segment(
                    airline=s.get("airline"),
                    flight_number=s.get("flight_number"),
                    from_airport=(s.get("departure_airport") or {}).get("id"),
                    departure_time=(s.get("departure_airport") or {}).get("time"),
                    to_airport=(s.get("arrival_airport") or {}).get("id"),
                    arrival_time=(s.get("arrival_airport") or {}).get("time"),
                    duration_minutes=s.get("duration") or 0,
                )
                for s in f.get("flights", [])
            ]
            out.append(FlightOption(
                category=category,
                airline=segs[0].airline if segs else None,
                price=f.get("price"),
                currency=currency,
                tax_inclusion=None,
                booking_link=f.get("link"),
                total_duration_minutes=f.get("total_duration") or 0,
                stops=max(0, len(segs) - 1),
                segments=segs,
            ))
        return out
