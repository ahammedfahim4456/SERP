from datetime import date, datetime, timedelta, timezone
from typing import Any

from .quota import QuotaGuard
from .serpapi_client import SerpApiClient

CITIES = {
    "goa": ("Goa", 15.2993, 74.124),
    "pondicherry": ("Pondicherry", 11.9416, 79.8083),
    "jaipur": ("Jaipur", 26.9124, 75.7873),
    "udaipur": ("Udaipur", 24.5854, 73.7125),
    "manali": ("Manali", 32.2396, 77.1887),
    "rishikesh": ("Rishikesh", 30.0869, 78.2676),
    "bangkok": ("Bangkok", 13.7563, 100.5018),
    "bali": ("Bali", -8.4095, 115.1889),
    "kochi": ("Kochi", 9.9312, 76.2673),
    "munnar": ("Munnar", 10.0889, 77.0595),
    "alleppey": ("Alleppey", 9.4981, 76.3388),
    "mysuru": ("Mysuru", 12.2958, 76.6394),
    "hampi": ("Hampi", 15.335, 76.46),
    "ooty": ("Ooty", 11.4102, 76.695),
    "kodaikanal": ("Kodaikanal", 10.2381, 77.4892),
    "madurai": ("Madurai", 9.9252, 78.1198),
    "hyderabad": ("Hyderabad", 17.385, 78.4867),
    "varanasi": ("Varanasi", 25.3176, 82.9739),
}


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (float, int)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.replace(",", "").replace("₹", "").strip())
        except ValueError:
            return None
    return None


def _types(result: dict[str, Any]) -> str:
    value = result.get("type") or result.get("types") or ""
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    return str(value)


def _category(result: dict[str, Any], *, food: bool = False) -> str:
    place_type = _types(result).lower()
    if food:
        return "Café" if any(word in place_type for word in ("cafe", "coffee", "bakery")) else "Restaurant"
    if any(word in place_type for word in ("beach", "lake", "park", "falls", "hill", "garden")):
        return "Nature"
    if any(word in place_type for word in (
        "temple", "fort", "palace", "museum", "monument", "market",
    )):
        return "Heritage"
    return "Adventure"


def _hours(result: dict[str, Any]) -> str:
    value = result.get("hours") or result.get("operating_hours")
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return "; ".join(f"{day}: {hours}" for day, hours in value.items())
    return ""


def _place(
    slug: str,
    city_name: str,
    index: int,
    result: dict[str, Any],
    category: str,
    *,
    price: float | None,
) -> dict[str, Any] | None:
    name = result.get("title")
    coordinates = result.get("gps_coordinates")
    if not isinstance(name, str) or not name.strip() or not isinstance(coordinates, dict):
        return None
    lat = _number(coordinates.get("latitude"))
    lng = _number(coordinates.get("longitude"))
    if lat is None or lng is None:
        return None
    place_type = _types(result)
    about = result.get("description") or result.get("snippet")
    if not isinstance(about, str) or not about.strip():
        about = f"{place_type or category} in {city_name}"
    image = result.get("thumbnail")
    return {
        "id": f"{slug}-{index}",
        "name": name,
        "category": category,
        "price": price,
        "rating": _number(result.get("rating")),
        "image": image if isinstance(image, str) else None,
        "imageAlt": f"{name}, {city_name}",
        "lat": lat,
        "lng": lng,
        "about": about,
        "hours": _hours(result),
        "area": result.get("address"),
        "diet": "any",
    }


def map_maps_results(
    slug: str,
    city_name: str,
    response: dict[str, Any],
    *,
    food: bool = False,
) -> list[dict[str, Any]]:
    results = response.get("local_results")
    if not isinstance(results, list):
        return []
    places = []
    for index, result in enumerate(results):
        if not isinstance(result, dict):
            continue
        price = None
        if food:
            price = {
                "₹": 150,
                "₹₹": 350,
                "₹₹₹": 700,
                "₹₹₹₹": 1200,
            }.get(result.get("price"))
        else:
            price = 0
        place = _place(
            slug,
            city_name,
            index,
            result,
            _category(result, food=food),
            price=price,
        )
        if place is not None:
            places.append(place)
        if len(places) == 6:
            break
    return places


def map_hotel_results(slug: str, city_name: str, response: dict[str, Any]) -> list[dict[str, Any]]:
    results = response.get("properties")
    if not isinstance(results, list):
        return []
    places = []
    for index, result in enumerate(results):
        if not isinstance(result, dict):
            continue
        images = result.get("images")
        first_image = images[0] if isinstance(images, list) and images else None
        hotel = {
            **result,
            "gps_coordinates": result.get("gps_coordinates"),
            "thumbnail": first_image.get("thumbnail") if isinstance(first_image, dict) else None,
        }
        rate = result.get("rate_per_night")
        lowest = rate.get("extracted_lowest") if isinstance(rate, dict) else None
        place = _place(
            slug,
            city_name,
            index,
            hotel,
            "Stay",
            price=_number(lowest),
        )
        if place is not None:
            places.append(place)
        if len(places) == 6:
            break
    return places


def map_events(response: dict[str, Any]) -> list[dict[str, Any]]:
    results = response.get("events_results")
    if not isinstance(results, list):
        return []
    events = []
    for result in results:
        if not isinstance(result, dict) or not isinstance(result.get("title"), str):
            continue
        date_info = result.get("date")
        date_text = date_info.get("when") if isinstance(date_info, dict) else date_info
        address = result.get("address")
        venue = ", ".join(address) if isinstance(address, list) else address
        image = result.get("thumbnail")
        events.append({
            "title": result["title"],
            "date": date_text if isinstance(date_text, str) else None,
            "venue": venue if isinstance(venue, str) else None,
            "image": image if isinstance(image, str) else None,
            "imageAlt": result["title"],
            "url": result.get("link") if isinstance(result.get("link"), str) else None,
        })
        if len(events) == 6:
            break
    return events


class CityPlacesService:
    def __init__(
        self,
        client: SerpApiClient,
        quota: QuotaGuard,
        cache_ttl_seconds: int,
    ) -> None:
        self.client = client
        self.quota = quota
        self.cache_ttl_seconds = cache_ttl_seconds

    async def get_places(
        self,
        slug: str,
        days: int = 4,
        start: date | None = None,
        include_events: bool = False,
    ) -> dict[str, Any]:
        city = CITIES.get(slug)
        if city is None:
            raise KeyError(slug)
        name, lat, lng = city
        check_in = start or date.today() + timedelta(days=21)
        check_out = check_in + timedelta(days=days)
        attractions_raw = await self.client.google_maps_places(
            f"top tourist attractions in {name}", lat, lng, zoom=12,
            persistent_ttl_seconds=self.cache_ttl_seconds, quota=self.quota,
        )
        food_raw = await self.client.google_maps_places(
            f"best restaurants and cafes in {name}", lat, lng, zoom=12,
            persistent_ttl_seconds=self.cache_ttl_seconds, quota=self.quota,
        )
        stays_raw = await self.client.google_hotels(
            f"hotels in {name}", check_in, check_out, 1, [], "INR",
            persistent_ttl_seconds=self.cache_ttl_seconds, quota=self.quota,
        )
        events_raw = (
            await self.client.google_events(
                f"Events in {name}",
                persistent_ttl_seconds=self.cache_ttl_seconds,
                quota=self.quota,
            )
            if include_events
            else {}
        )
        attractions = map_maps_results(slug, name, attractions_raw)
        food = map_maps_results(slug, name, food_raw, food=True)
        stays = map_hotel_results(slug, name, stays_raw)
        for index, place in enumerate([*attractions, *food, *stays]):
            place["id"] = f"{slug}-{index}"
        return {
            "slug": slug,
            "attractions": attractions,
            "food": food,
            "stays": stays,
            "events": map_events(events_raw),
            "source": "serpapi",
            "cachedAt": datetime.now(timezone.utc).isoformat(),
        }
