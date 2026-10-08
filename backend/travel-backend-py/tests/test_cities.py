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
