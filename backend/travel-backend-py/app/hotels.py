import logging
import re
from datetime import date, datetime, timezone

from .hotel_ranking import rank
from .normalizer import normalize_location
from .quota import QuotaGuard
from .schemas import BookingSource, Coordinates, HotelOption, HotelSearchResponse
from .serpapi_client import SerpApiClient

log = logging.getLogger("hotels")

MAX_NIGHTS = 30
HOSTEL_WORDS = ("hostel", "dorm", "zostel", "gostops", "backpacker")

# normalized tag -> test on the lowercased raw amenity string
FEATURE_RULES = {
    "free_breakfast": lambda a: "free breakfast" in a,
    "wifi": lambda a: "wi-fi" in a,
    "parking": lambda a: "parking" in a,
    "kid_friendly": lambda a: "kid-friendly" in a,
    "crib": lambda a: "crib" in a,
    "pool": lambda a: "pool" in a,
    "airport_shuttle": lambda a: "airport shuttle" in a,
    "business_center": lambda a: "business center" in a,
    "air_conditioning": lambda a: "air conditioning" in a,
    "kitchen": lambda a: a.startswith("kitchen"),
    "restaurant": lambda a: a == "restaurant",
    "laundry": lambda a: "laundry" in a,
    "room_service": lambda a: "room service" in a,
}


def parse_child_ages(raw: str | None, children: int) -> list[int]:
    if children == 0:
        return []
    if not raw:
        raise ValueError("childAges is required when children > 0, e.g. childAges=5,8")
    try:
        ages = [int(x) for x in raw.split(",") if x.strip() != ""]
    except ValueError:
        raise ValueError("childAges must be comma-separated whole numbers, e.g. 5,8") from None
    if len(ages) != children:
        raise ValueError("childAges must have exactly one age per child")
    if any(a < 0 or a > 17 for a in ages):
        raise ValueError("each child age must be between 0 and 17")
    return ages


def _duration_minutes(text: str | None) -> int | None:
    if not text:
        return None
    hours = re.search(r"(\d+)\s*hr", text)
    mins = re.search(r"(\d+)\s*min", text)
    if not hours and not mins:
        return None
    return (int(hours.group(1)) if hours else 0) * 60 + (int(mins.group(1)) if mins else 0)


def _airport_taxi_minutes(nearby: list[dict]) -> int | None:
    for place in nearby or []:
        if "airport" in (place.get("name") or "").lower():
            for t in place.get("transportations") or []:
                if (t.get("type") or "").lower() == "taxi":
                    return _duration_minutes(t.get("duration"))
    return None


def _first_int(pattern: str, strings: list[str]) -> int | None:
    for s in strings:
        m = re.search(pattern, s, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


class HotelService:
    def __init__(self, client: SerpApiClient, cache, quota: QuotaGuard, ttl_seconds: int) -> None:
        self.client = client
        self.cache = cache
        self.quota = quota
        self.ttl_seconds = ttl_seconds

    async def search(self, destination: str, check_in: date, check_out: date, adults: int,
                     child_ages: list[int], currency: str, profile: str | None,
                     include_rentals: bool | None, include_hostels: bool, limit: int) -> HotelSearchResponse:
        loc = normalize_location(destination)
        destination_clean = loc.display_name
        cache_dest_id = loc.canonical_id
        currency = currency.upper()
        nights = (check_out - check_in).days
        if nights < 1:
            raise ValueError("checkOut must be after checkIn")
        if nights > MAX_NIGHTS:
            raise ValueError(f"stays longer than {MAX_NIGHTS} nights are not supported")
        if check_in < date.today():
            raise ValueError("checkIn must not be in the past")

        # the cache holds the UNRANKED list, so switching profile never costs a credit
        # using canonical id ensures "Bangalore", "Bengaluru", "BLR" all share one cache entry!
        key = ":".join(["hotels", cache_dest_id, check_in.isoformat(), check_out.isoformat(),
                        str(adults), ",".join(map(str, child_ages)) or "-", currency])

        base: HotelSearchResponse | None = None
        hit = await self.cache.get(key)
        if hit:
            try:
                log.info("cache HIT %s", key)
                base = HotelSearchResponse.model_validate_json(hit).model_copy(update={"cached": True})
            except ValueError:
                log.warning("bad cache entry for %s, refetching", key)

        if base is None:
            log.info("cache MISS %s", key)
            await self.quota.ensure_available()
            raw = await self.client.google_hotels(f"Hotels in {destination_clean}", check_in, check_out,
                                                  adults, child_ages, currency)
            await self.quota.record_call()
            base = HotelSearchResponse(
                cached=False, fetched_at=datetime.now(timezone.utc), destination=destination_clean,
                check_in=check_in, check_out=check_out, nights=nights, adults=adults,
                children=len(child_ages),
                google_hotels_url=(raw.get("search_metadata") or {}).get("google_hotels_url"),
                total_found=len(raw.get("properties") or []),
                options=self.parse(raw, currency, nights))
            await self.cache.set(key, base.model_dump_json(), self.ttl_seconds)

        return rank(base, profile=profile, include_rentals=include_rentals,
                    include_hostels=include_hostels, limit=limit)

    @staticmethod
    def parse(raw: dict, currency: str, nights: int) -> list[HotelOption]:
        out = []
        for p in raw.get("properties") or []:        # "ads" are sponsored listings: deliberately ignored
            token = p.get("property_token")
            if not token or not p.get("name"):
                continue
            night = (p.get("rate_per_night") or {})
            total = (p.get("total_rate") or {})
            per_night = night.get("extracted_lowest")
            total_price = total.get("extracted_lowest")
            if total_price is None and per_night is not None:
                total_price = per_night * nights
            if per_night is None and total_price is not None:
                per_night = round(total_price / nights)

            amenities = p.get("amenities") or []
            lowered = [a.lower() for a in amenities]
            features = [tag for tag, test in FEATURE_RULES.items() if any(test(a) for a in lowered)]
            essential = p.get("essential_info") or []
            images = p.get("images") or []
            first_image = images[0] if images and isinstance(images[0], dict) else {}

            sources, any_free = [], None
            for s in p.get("prices") or []:
                fc = s.get("free_cancellation")
                if fc is True:
                    any_free = True
                elif fc is False and any_free is None:
                    any_free = False
                sources.append(BookingSource(
                    name=s.get("source") or "unknown",
                    price_per_night=(s.get("rate_per_night") or {}).get("extracted_lowest"),
                    free_cancellation=fc,
                    free_cancellation_until=s.get("free_cancellation_until_date")))

            website = p.get("link")
            gps = p.get("gps_coordinates")
            deal = p.get("deal_description")
            if deal and p.get("deal"):
                deal = f"{deal}: {p['deal']}"

            out.append(HotelOption(
                id=token, name=p["name"],
                kind="rental" if p.get("type") == "vacation rental" else "hotel",
                image_url=first_image.get("thumbnail") or first_image.get("original_image"),
                hostel_like=any(w in f"{p['name']} {website or ''}".lower() for w in HOSTEL_WORDS),
                star_class=p.get("extracted_hotel_class"),
                rating=p.get("overall_rating"), review_count=p.get("reviews"),
                location_rating=p.get("location_rating"),
                currency=currency, nights=nights,
                price_per_night=per_night, total_price=total_price,
                total_price_before_taxes=total.get("extracted_before_taxes_fees"),
                deal=deal or None,
                features=features, amenities=amenities,
                sleeps=_first_int(r"sleeps\s+(\d+)", essential),
                bedrooms=_first_int(r"(\d+)\s+bedroom", essential),
                check_in_time=p.get("check_in_time"), check_out_time=p.get("check_out_time"),
                airport_taxi_minutes=_airport_taxi_minutes(p.get("nearby_places")),
                coordinates=Coordinates(latitude=gps["latitude"], longitude=gps["longitude"]) if gps else None,
                website=website, booking_sources=sources, free_cancellation=any_free))
        return out
