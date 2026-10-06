import logging
import re
from collections import defaultdict
from datetime import datetime, timezone

from .food_ranking import rank
from .quota import QuotaGuard
from .schemas import Coordinates, FoodOption, FoodSearchResponse
from .serpapi_client import SerpApiClient

log = logging.getLogger("food")

CATEGORY_QUERY = {
    "any": "restaurants", "vegetarian": "vegetarian restaurants", "family": "family restaurants",
    "breakfast": "breakfast restaurants", "cafe": "cafes", "fine_dining": "fine dining restaurants",
}
CUISINE_RE = re.compile(r"^[A-Za-z][A-Za-z \-]{1,39}$")
ALCOHOL_WORDS = ("alcohol", "wine", "spirits", "beer", "happy-hour")


def build_query(category: str, cuisine: str | None, vegetarian_only: bool) -> str:
    if vegetarian_only:                       # strict veg needs veg-relevant results to filter from
        category = "vegetarian"
    base = CATEGORY_QUERY[category]
    if cuisine:
        cuisine = " ".join(cuisine.split())
        if not CUISINE_RE.match(cuisine):
            raise ValueError("cuisine must be 2 to 40 letters, e.g. 'chettinad'")
        return f"{cuisine} {base}"
    return base


def parse_price(label: str | None) -> tuple[int | None, int | None]:
    """'₹200–400' -> (200, 400); '₹2,000+' -> (2000, None); missing -> (None, None)."""
    if not label:
        return None, None
    nums = [int(n.replace(",", "")) for n in re.findall(r"\d[\d,]*", label)]
    if not nums:
        return None, None
    return (nums[0], nums[1]) if len(nums) >= 2 else (nums[0], None)


def _clean(text: str | None) -> str | None:
    return text.replace("\u202f", " ").replace("\u2009", " ").strip() if text else text


def _extensions(p: dict) -> dict[str, list[str]]:
    out: dict[str, list[str]] = defaultdict(list)
    for block in (p.get("extensions") or []) + (p.get("unsupported_extensions") or []):
        for key, values in block.items():
            for v in values:
                if v not in out[key]:
                    out[key].append(v)
    return out


def _features(p: dict, ext: dict[str, list[str]]) -> list[str]:
    tags: set[str] = set()
    kids, crowd, planning = ext["children"], ext["crowd"], ext["planning"]
    offers = ext["offerings"]
    if "Good for kids" in kids: tags.add("kid_friendly")
    if "Kids' menu" in kids: tags.add("kids_menu")
    if "High chairs" in kids: tags.add("high_chairs")
    if "Family friendly" in crowd: tags.add("family_friendly")
    if "Groups" in crowd: tags.add("groups")
    if "Tourists" in crowd: tags.add("tourists")
    if "Accepts reservations" in planning or "Reservations required" in planning or p.get("reserve_a_table"):
        tags.add("reservations")
    if "Vegetarian options only" in offers or any(t in ("vegetarian_restaurant", "vegan_restaurant")
                                                  for t in p.get("type_ids") or []):
        tags.add("vegetarian_only")
    if "Vegetarian options" in offers: tags.add("vegetarian_options")
    if "Vegan options" in offers: tags.add("vegan_options")
    if "Quick bite" in offers: tags.add("quick_bite")
    if "Healthy options" in offers: tags.add("healthy_options")
    if "Late-night food" in offers: tags.add("late_night")
    if any(w in o.lower() for o in offers for w in ALCOHOL_WORDS) or "Bar on site" in ext["amenities"]:
        tags.add("serves_alcohol")
    if any("parking" in x.lower() and not x.lower().startswith("difficult") for x in ext["parking"]):
        tags.add("parking")
    if any("wi-fi" in x.lower() for x in ext["amenities"]): tags.add("wifi")
    if "Quiet" in ext["atmosphere"]: tags.add("quiet")
    if "Romantic" in ext["atmosphere"]: tags.add("romantic")
    if "Wheelchair-accessible entrance" in ext["accessibility"]: tags.add("wheelchair_accessible")
    if "Cash only" in ext["payments"]: tags.add("cash_only")
    if "Outdoor seating" in ext["service_options"]: tags.add("outdoor_seating")

    so = p.get("service_options")
    if isinstance(so, dict):
        if so.get("dine_in"): tags.add("dine_in")
        if so.get("takeaway"): tags.add("takeaway")
        if so.get("delivery") or so.get("no_contact_delivery"): tags.add("delivery")
    else:                                     # some results only list service options as text
        if "Dine-in" in ext["service_options"]: tags.add("dine_in")
        if "Takeaway" in ext["service_options"]: tags.add("takeaway")
        if "Delivery" in ext["service_options"]: tags.add("delivery")
    return sorted(tags)


class FoodService:
    def __init__(self, client: SerpApiClient, cache, quota: QuotaGuard, ttl_seconds: int) -> None:
        self.client, self.cache, self.quota, self.ttl_seconds = client, cache, quota, ttl_seconds

    async def search(self, lat: float, lng: float, category: str, cuisine: str | None,
                     vegetarian_only: bool, meal: str | None, max_km: float, min_rating: float | None,
                     adults: int, children: int, profile: str | None, limit: int) -> FoodSearchResponse:
        query = build_query(category, cuisine, vegetarian_only)
        # round to 3 decimals (about 100 m): nearby hotels share one cache entry, and we SEND the
        # rounded point, so the cached results match exactly what was fetched
        rlat, rlng = round(lat, 3), round(lng, 3)
        key = f"food:{query.lower()}|{rlat:.3f},{rlng:.3f}"

        base: FoodSearchResponse | None = None
        hit = await self.cache.get(key)
        if hit:
            try:
                log.info("cache HIT %s", key)
                base = FoodSearchResponse.model_validate_json(hit).model_copy(update={"cached": True})
            except ValueError:
                log.warning("bad cache entry for %s, refetching", key)

        if base is None:
            log.info("cache MISS %s", key)
            await self.quota.ensure_available()
            raw = await self.client.google_maps_places(query, rlat, rlng)
            await self.quota.record_call()
            base = FoodSearchResponse(
                cached=False, fetched_at=datetime.now(timezone.utc), query=query,
                total_found=len(raw.get("local_results") or []), options=self.parse(raw))
            await self.cache.set(key, base.model_dump_json(), self.ttl_seconds)

        return rank(base, lat, lng, profile, children, adults + children, meal, max_km, min_rating,
                    vegetarian_only, limit)

    @staticmethod
    def parse(raw: dict) -> list[FoodOption]:
        out = []
        for p in raw.get("local_results") or []:
            pid = p.get("place_id") or p.get("data_id")
            if not pid or not p.get("title"):
                continue
            ext = _extensions(p)
            low, high = parse_price(p.get("price"))
            est = (low + high) // 2 if low is not None and high is not None else low
            gps = p.get("gps_coordinates")
            meals = [m for m in ("breakfast", "lunch", "dinner")
                     if m.title() in ext["popular_for"] or m.title() in ext["dining_options"]]
            out.append(FoodOption(
                id=pid, name=p["title"], type=p.get("type"), types=p.get("types") or [],
                rating=p.get("rating"), review_count=p.get("reviews"), address=p.get("address"),
                coordinates=Coordinates(latitude=gps["latitude"], longitude=gps["longitude"]) if gps else None,
                phone=p.get("phone"), website=p.get("website"), thumbnail=p.get("thumbnail"),
                price_label=p.get("price"), price_low=low, price_high=high, estimated_per_person=est,
                open_state=_clean(p.get("open_state")),
                operating_hours={k: _clean(v) for k, v in (p.get("operating_hours") or {}).items()},
                meals=meals, features=_features(p, ext), atmosphere=ext["atmosphere"],
                highlights=ext["highlights"],
                can_reserve=bool(p.get("reserve_a_table")), order_online=bool(p.get("order_online")),
                google_position=p.get("position")))
        return out
