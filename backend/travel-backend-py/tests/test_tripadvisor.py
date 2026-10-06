import os

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app


class FakeTripadvisorClient:
    def __init__(self, payload):
        self.payload = payload
        self.calls = 0

    async def tripadvisor(self, *args, **kwargs):
        self.calls += 1
        return self.payload


@pytest.fixture
def client():
    with TestClient(app) as c:
        c.fake = FakeTripadvisorClient({
            "place_results": [
                {
                    "title": "Om Beach Coastal Walk",
                    "type": "Outdoor Attraction",
                    "description": "Scenic coastal cliff path with panoramic sunset viewpoints.",
                    "location": "Gokarna, Karnataka",
                    "rating": 4.7,
                    "reviews": 1280,
                }
            ]
        })
        app.state.tripadvisor.client = c.fake
        yield c


def test_tripadvisor_endpoint(client):
    res = client.get("/api/recommendations/tripadvisor?destination=Gokarna&budget=15000")
    assert res.status_code == 200
    data = res.json()
    assert data["destination"] == "Gokarna"
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["title"] == "Om Beach Coastal Walk"
    assert data["recommendations"][0]["rating"] == 4.7
