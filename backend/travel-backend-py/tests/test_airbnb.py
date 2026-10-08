import os
from datetime import date, timedelta

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app


class FakeAirbnbClient:
    def __init__(self):
        self.calls = 0
        self.args = None

    async def airbnb(self, *args):
        self.calls += 1
        self.args = args
        return {
            "properties": [
                {
                    "id": "listing-1",
                    "name": "Bright guesthouse in Bengaluru",
                    "property_type": "Guesthouse",
                    "room_type": "Entire place",
                    "images": [{"url": "https://images.example/stay.jpg"}],
                    "price": {"rate": {"amount": "₹3,200"}, "total": {"amount": "₹6,400"}},
                    "rating": 4.8,
                    "reviews": 120,
                    "link": "https://www.airbnb.com/rooms/listing-1",
                }
            ]
        }


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        fake = FakeAirbnbClient()
        app.state.airbnb.client = fake
        test_client.fake = fake
        yield test_client


def search_url(**extra):
    check_in = date.today() + timedelta(days=30)
    params = {
        "destination": "Bengaluru",
        "checkIn": check_in.isoformat(),
        "checkOut": (check_in + timedelta(days=2)).isoformat(),
        "adults": 2,
        "children": 1,
        "currency": "INR",
    }
    params.update(extra)
    return "/api/airbnb/search?" + "&".join(f"{key}={value}" for key, value in params.items())


def test_airbnb_endpoint_normalizes_and_caches_results(client):
    first = client.get(search_url()).json()
    second = client.get(search_url()).json()

    assert first["destination"] == "Bengaluru"
    assert first["totalFound"] == 1
    assert first["options"][0]["imageUrl"] == "https://images.example/stay.jpg"
    assert first["options"][0]["pricePerNight"] == 3200
    assert first["options"][0]["totalPrice"] == 6400
    assert first["options"][0]["rating"] == 4.8
    assert first["options"][0]["reviewCount"] == 120
    assert first["cached"] is False and second["cached"] is True
    assert client.fake.calls == 1


@pytest.mark.parametrize("check_in_offset,check_out_offset,status", [
    (-1, 1, 400),
    (3, 3, 400),
    (3, 35, 400),
])
def test_airbnb_rejects_invalid_dates_before_upstream_call(
    client, check_in_offset, check_out_offset, status
):
    today = date.today()
    response = client.get(search_url(
        checkIn=(today + timedelta(days=check_in_offset)).isoformat(),
        checkOut=(today + timedelta(days=check_out_offset)).isoformat(),
    ))

    assert response.status_code == status
    assert client.fake.calls == 0
