import json
import os
from datetime import date, timedelta
from pathlib import Path

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app

FIX = Path(__file__).parent / "fixtures"


class FakeClient:
    def __init__(self, payload):
        self.payload, self.calls, self.last_args = payload, 0, None

    async def google_hotels(self, *args, **kwargs):
        self.calls += 1
        self.last_args = args
        return self.payload


@pytest.fixture
def client():
    with TestClient(app) as c:
        payload = json.loads((FIX / "hotels_family_bengaluru.json").read_text(encoding="utf-8"))
        c.fake = FakeClient(payload)
        app.state.hotels.client = c.fake
        yield c


def q(**extra):
    check_in = date.today() + timedelta(days=30)
    params = {"destination": "Bengaluru", "checkIn": check_in.isoformat(),
              "checkOut": (check_in + timedelta(days=2)).isoformat(), "adults": 2}
    params.update(extra)
    return "/api/hotels/search?" + "&".join(f"{k}={v}" for k, v in params.items())


def test_second_search_is_cached_and_changing_profile_costs_no_credit(client):
    first = client.get(q(children=2, childAges="5,8")).json()
    second = client.get(q(children=2, childAges="5,8")).json()
    other_profile = client.get(q(children=2, childAges="5,8", profile="business")).json()
    assert (first["cached"], second["cached"], other_profile["cached"]) == (False, True, True)
    assert client.fake.calls == 1
    assert client.get("/api/usage").json()["serpapiCallsThisMonth"] == 1
    assert first["profile"] == "family" and other_profile["profile"] == "business"


def test_response_is_camel_case_and_ranked(client):
    body = client.get(q(children=2, childAges="5,8")).json()
    assert body["nights"] == 2 and body["unpricedCount"] == 9
    assert body["googleHotelsUrl"].startswith("https://www.google.com")
    top = body["options"][0]
    assert top["labels"][0] == "Top pick" and "totalPrice" in top and 0 <= top["score"] <= 100


def test_different_guests_is_a_new_search(client):
    client.get(q(adults=2))
    client.get(q(adults=3))
    assert client.fake.calls == 2


def test_query_and_child_ages_reach_the_client(client):
    client.get(q(children=2, childAges="5,8"))
    query, check_in, check_out, adults, ages, currency = client.fake.last_args
    assert query == "Hotels in Bengaluru" and ages == [5, 8] and adults == 2 and currency == "INR"


@pytest.mark.parametrize("extra", [
    {"children": 2},                                  # ages missing
    {"children": 2, "childAges": "5"},                # wrong count
    {"children": 1, "childAges": "40"},               # impossible age
])
def test_child_age_validation_is_400(client, extra):
    assert client.get(q(**extra)).status_code == 400


def test_date_validation(client):
    today = date.today()
    bad = [
        ("/api/hotels/search?destination=Bengaluru&checkIn=%s&checkOut=%s" % (today + timedelta(days=5), today + timedelta(days=5)), 400),
        ("/api/hotels/search?destination=Bengaluru&checkIn=%s&checkOut=%s" % (today - timedelta(days=2), today + timedelta(days=1)), 400),
        ("/api/hotels/search?destination=Bengaluru&checkIn=%s&checkOut=%s" % (today + timedelta(days=5), today + timedelta(days=50)), 400),
        (q(profile="luxury"), 422),
        ("/api/hotels/search?destination=B&checkIn=2030-01-01&checkOut=2030-01-02", 422),
    ]
    for url, status in bad:
        assert client.get(url).status_code == status, url
    assert client.fake.calls == 0                      # invalid requests never spend a credit
