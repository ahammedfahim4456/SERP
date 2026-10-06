"""Uses real SerpApi responses saved from the probe, so these tests cost zero credits."""
import json
import os
from pathlib import Path

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.transit import TransitService

FIX = Path(__file__).parent / "fixtures"


def load(name):
    return json.loads((FIX / name).read_text(encoding="utf-8"))


class FakeClient:
    def __init__(self, payload):
        self.payload, self.calls = payload, 0

    async def google_maps_transit(self, origin, destination):
        self.calls += 1
        return self.payload


@pytest.fixture
def client():
    with TestClient(app) as c:
        c.fake = FakeClient(load("chennai_bengaluru_train.json"))
        app.state.transit.client = c.fake
        yield c


def test_parse_train_route():
    opts = TransitService.parse(load("chennai_bengaluru_train.json"))
    assert len(opts) == 6                       # only Transit options, walking/driving dropped
    first = opts[0]
    assert first.main_mode == "train"
    assert first.legs[0].service_number == "16551"
    assert first.legs[0].from_code == "MAS" and first.legs[0].to_code == "SBC"
    assert first.legs[0].operator == "Indian Railways"
    assert first.fare == 172.7 and first.currency == "INR"
    assert first.walking_minutes == 37          # 7 min + 30 min walking legs
    assert first.duration_minutes == 417


def test_parse_mixed_route_detects_bus_and_metro_and_missing_fare():
    opts = TransitService.parse(load("chennai_bengaluru_bus_mixed.json"))
    modes = {leg.mode for o in opts for leg in o.legs}
    assert {"train", "bus", "metro"} <= modes
    assert all(o.fare is None for o in opts)
    intercity_bus = opts[-1]
    assert intercity_bus.main_mode == "bus"
    assert intercity_bus.legs[0].operator == "IntrCity SmartBus"
    assert intercity_bus.legs[0].service_number is None


def test_multi_leg_option():
    opts = TransitService.parse(load("chennai_madurai_train.json"))
    assert len(opts[-1].legs) == 2              # EMU to Tambaram + Kollam Express


def test_endpoint_caches_second_identical_search(client):
    q = "/api/transit/search?origin=Chennai Central, Chennai&destination=Bengaluru City Junction, Bengaluru"
    first, second = client.get(q).json(), client.get(q).json()
    assert first["cached"] is False and second["cached"] is True
    assert client.fake.calls == 1
    assert first["options"][0]["legs"][0]["serviceNumber"] == "16551"
    # same search with different capitalisation / spacing hits the same cache entry
    third = client.get("/api/transit/search?origin=chennai  central, chennai&destination=BENGALURU city junction, bengaluru").json()
    assert third["cached"] is True and client.fake.calls == 1


def test_validation(client):
    assert client.get("/api/transit/search?origin=A&destination=Bengaluru").status_code == 422
    assert client.get("/api/transit/search?origin=Chennai&destination=chennai").status_code == 400
