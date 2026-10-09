import os

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

from fastapi.testclient import TestClient

from app.main import app


def test_city_catalog_has_search_coordinates_without_provider_calls():
    with TestClient(app) as client:
        response = client.get("/api/cities")

    assert response.status_code == 200
    cities = response.json()["cities"]
    assert len(cities) == 18
    assert all(city["iataCode"] for city in cities)
    assert all(city["latitude"] is not None and city["longitude"] is not None for city in cities)


def test_city_catalog_search_filters_by_state():
    with TestClient(app) as client:
        response = client.get("/api/cities", params={"q": "Kerala"})

    assert response.status_code == 200
    assert {city["canonicalId"] for city in response.json()["cities"]} == {
        "kochi",
        "thiruvananthapuram",
    }


def test_city_places_returns_404_for_unknown_destination():
    with TestClient(app) as client:
        response = client.get("/api/city/not-a-destination")

    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown destination"}


def test_city_places_route_passes_date_duration_and_events(monkeypatch):
    from datetime import date, timedelta

    expected_start = date.today() + timedelta(days=30)
    seen = {}

    async def fake_get_places(slug, days, start, include_events):
        seen.update(slug=slug, days=days, start=start, include_events=include_events)
        return {"slug": slug, "source": "serpapi"}

    with TestClient(app) as client:
        monkeypatch.setattr(client.app.state.city_places, "get_places", fake_get_places)
        response = client.get(
            "/api/city/goa",
            params={"days": 5, "start": expected_start.isoformat(), "events": 1},
        )

    assert response.status_code == 200
    assert response.json() == {"slug": "goa", "source": "serpapi"}
    assert seen == {
        "slug": "goa",
        "days": 5,
        "start": expected_start,
        "include_events": True,
    }
