"""Runs against a fake SerpApi client, so these tests cost zero credits."""
import os
from datetime import date, timedelta

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app

FAKE = {
    "best_flights": [{
        "flights": [{
            "airline": "IndiGo", "flight_number": "6E 123", "duration": 65,
            "departure_airport": {"id": "MAA", "time": "2026-11-10 07:00"},
            "arrival_airport": {"id": "BLR", "time": "2026-11-10 08:05"},
        }],
        "total_duration": 65, "price": 3500,
    }],
    "other_flights": [],
}


class FakeClient:
    def __init__(self):
        self.calls = 0

    async def google_flights(self, *args, **kwargs):
        self.calls += 1
        return FAKE


@pytest.fixture
def client():
    with TestClient(app) as c:
        fake = FakeClient()
        app.state.flights.client = fake
        app.state.quota._limit = 2          # set here, not via env, so other test files can't override it
        c.fake = fake
        yield c


def url(d=None, **extra):
    d = d or (date.today() + timedelta(days=30))
    q = f"origin=MAA&destination=BLR&date={d.isoformat()}"
    for k, v in extra.items():
        q += f"&{k}={v}"
    return f"/api/flights/search?{q}"


def test_second_identical_search_is_served_from_cache(client):
    first = client.get(url()).json()
    second = client.get(url()).json()
    assert first["cached"] is False
    assert second["cached"] is True
    assert client.fake.calls == 1
    assert first["options"][0]["price"] == 3500
    assert first["options"][0]["segments"][0]["flightNumber"] == "6E 123"
    assert client.get("/api/usage").json()["serpapiCallsThisMonth"] == 1


def test_different_params_are_separate_cache_entries(client):
    client.get(url())
    client.get(url(adults=2))
    assert client.fake.calls == 2


def test_quota_guard_blocks_after_limit(client):
    base = date.today() + timedelta(days=40)
    assert client.get(url(base)).status_code == 200
    assert client.get(url(base + timedelta(days=1))).status_code == 200
    assert client.get(url(base + timedelta(days=2))).status_code == 429
    # cached results still work after the quota is hit
    assert client.get(url(base)).json()["cached"] is True


def test_validation(client):
    # MA is Morocco's ISO code and resolves to its capital airport.
    assert client.get("/api/flights/search?origin=MA&destination=BLR&date=2030-01-01").status_code == 200
    assert client.get(url(origin="x")).status_code in (200, 422)
    assert client.get("/api/flights/search?origin=MAA&destination=MAA&date=2030-01-01").status_code == 400
    assert client.get(url(date.today() - timedelta(days=1))).status_code == 400
    assert client.get(url(origin="Unknown place")).status_code == 400


def test_flight_quote_is_for_requested_party(client):
    result = client.get(url(children=2, adults=2)).json()
    assert result["adults"] == 2
    assert result["children"] == 2
    option = result["options"][0]
    assert option["price"] == 3500
    assert option["taxInclusion"] is None
