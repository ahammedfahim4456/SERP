import asyncio
import json
from datetime import timedelta
from pathlib import Path

from app.city_places import CityPlacesService, map_hotel_results, map_maps_results

FIXTURES = Path(__file__).parent / "fixtures"


def fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_maps_place_mapping_skips_missing_coordinates_and_maps_categories():
    places = map_maps_results("pondicherry", "Pondicherry", fixture("city_maps.json"))

    assert len(places) == 1
    assert places[0]["category"] == "Nature"
    assert places[0]["imageAlt"] == "Promenade Beach, Pondicherry"
    assert places[0]["image"] == "https://example.test/beach.jpg"
    assert places[0]["price"] == 0
    assert places[0]["diet"] == "any"


def test_food_mapping_estimates_price_from_rupee_symbols():
    places = map_maps_results(
        "pondicherry",
        "Pondicherry",
        fixture("city_food.json"),
        food=True,
    )

    assert [(place["category"], place["price"]) for place in places] == [
        ("Café", 350),
        ("Restaurant", 700),
    ]


def test_hotel_mapping_uses_nightly_rate_and_first_image():
    places = map_hotel_results(
        "pondicherry",
        "Pondicherry",
        fixture("city_hotels.json"),
    )

    assert len(places) == 1
    assert places[0]["category"] == "Stay"
    assert places[0]["price"] == 2400
    assert places[0]["image"] == "https://example.test/hotel.jpg"
    assert places[0]["imageAlt"] == "Heritage Stay, Pondicherry"


def test_city_service_uses_required_searches_and_optional_events():
    class Client:
        calls = []

        async def google_maps_places(self, query, lat, lng, **kwargs):
            self.calls.append(("maps", query, lat, lng, kwargs))
            filename = "city_maps.json" if query.startswith("top tourist") else "city_food.json"
            return fixture(filename)

        async def google_hotels(self, query, check_in, check_out, adults, children, currency, **kwargs):
            self.calls.append(("hotels", query, check_in, check_out, adults, currency, kwargs))
            return fixture("city_hotels.json")

        async def google_events(self, query, **kwargs):
            self.calls.append(("events", query, kwargs))
            return {"events_results": []}

    client = Client()
    service = CityPlacesService(client, quota=None, cache_ttl_seconds=86400)
    result = asyncio.run(service.get_places("pondicherry", days=3, include_events=True))

    assert result["slug"] == "pondicherry"
    assert result["source"] == "serpapi"
    ids = [
        place["id"]
        for category in ("attractions", "food", "stays")
        for place in result[category]
    ]
    assert len(ids) == len(set(ids)) == 4
    assert [call[0] for call in client.calls] == ["maps", "maps", "hotels", "events"]
    assert client.calls[0][1:] == (
        "top tourist attractions in Pondicherry",
        11.9416,
        79.8083,
        {"zoom": 12, "persistent_ttl_seconds": 86400, "quota": None},
    )
    hotel_call = client.calls[2]
    assert hotel_call[1] == "hotels in Pondicherry"
    assert hotel_call[3] == hotel_call[2] + timedelta(days=3)
    assert hotel_call[4:6] == (1, "INR")
