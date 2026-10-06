"""Parser, ranking, endpoint and client tests for food search. Real saved responses: zero credits."""
import asyncio
import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

os.environ.setdefault("SERPAPI_KEY", "test-key")
os.environ["REDIS_URL"] = ""

import httpx
import pytest
from fastapi.testclient import TestClient

from app.food import FoodService, build_query, parse_price
from app.food_ranking import PROFILES, adjusted_rating, haversine_km, rank
from app.main import app
from app.schemas import Coordinates, FoodOption, FoodSearchResponse
from app.serpapi_client import SerpApiClient

FIX = Path(__file__).parent / "fixtures"
VEG_MADURAI = (9.936392, 78.0872787)          # the anchor used for that saved probe
FAMILY_BLR = (12.9722428, 77.6086284)


def load(name):
    return json.loads((FIX / f"{name}.json").read_text(encoding="utf-8"))


def base(options):
    return FoodSearchResponse(cached=False, fetched_at=datetime.now(timezone.utc), query="q",
                              total_found=len(options), options=options)


def place(id, lat=9.0, lng=78.0, rating=4.5, reviews=500, est=300, **kw):
    return FoodOption(id=id, name=id, coordinates=Coordinates(latitude=lat, longitude=lng), rating=rating,
                      review_count=reviews, estimated_per_person=est, **kw)


# ------------------------------ parsing ------------------------------
@pytest.mark.parametrize("label,expected", [
    ("₹200–400", (200, 400)), ("₹1–200", (1, 200)), ("₹2,000+", (2000, None)),
    ("₹600–1,600", (600, 1600)), (None, (None, None)), ("", (None, None)),
])
def test_parse_price(label, expected):
    assert parse_price(label) == expected


def test_parse_real_veg_place():
    opts = FoodService.parse(load("food_near_hotel_veg_madurai"))
    assert len(opts) == 20
    p = opts[0]
    assert p.name.startswith("House Of Paneer")
    assert (p.price_low, p.price_high, p.estimated_per_person) == (200, 400, 300)
    assert p.open_state == "Open · Closes 11 pm"                  # narrow no-break space cleaned
    assert p.meals == ["breakfast", "lunch", "dinner"]
    assert {"vegetarian_only", "kid_friendly", "reservations", "dine_in", "takeaway", "delivery"} <= set(p.features)
    assert p.can_reserve is True and p.order_online is False
    assert p.coordinates.latitude == pytest.approx(9.9432131)


def test_city_search_without_anchor_has_fewer_fields():
    """Documents why the endpoint requires lat/lng: the un-anchored probe had no price band at all."""
    opts = FoodService.parse(load("food_city_madurai"))
    assert len(opts) == 20 and all(o.price_label is None for o in opts)


def test_parse_family_signals_and_split_hours():
    opts = FoodService.parse(load("food_near_hotel_family_bengaluru"))
    karavalli = next(o for o in opts if o.name == "Karavalli")
    assert karavalli.price_low == 2000 and karavalli.price_high is None and karavalli.estimated_per_person == 2000
    assert {"kid_friendly", "high_chairs", "family_friendly", "reservations"} <= set(karavalli.features)
    assert any("," in v for o in opts for v in o.operating_hours.values())      # split shifts kept as text


def test_build_query():
    assert build_query("any", None, False) == "restaurants"
    assert build_query("family", "chettinad", False) == "chettinad family restaurants"
    assert build_query("any", None, True) == "vegetarian restaurants"          # strict veg forces a veg search
    with pytest.raises(ValueError):
        build_query("any", "x; drop", False)


# ------------------------------ ranking ------------------------------
def test_haversine_known_distance():
    assert haversine_km(9.9252, 78.1198, 9.9252, 78.1198) == 0
    assert haversine_km(12.9716, 77.5946, 13.0827, 80.2707) == pytest.approx(290, abs=15)   # Bengaluru-Chennai


def test_weights_sum_to_one_and_bayes():
    for p in PROFILES.values():
        assert abs(sum(p.weights.values()) - 1) < 1e-9
    assert adjusted_rating(5.0, 3, 4.2) < adjusted_rating(4.5, 3000, 4.2)


def test_ranking_real_family_search():
    opts = FoodService.parse(load("food_near_hotel_family_bengaluru"))
    r = rank(base(opts), *FAMILY_BLR, None, 2, 4, None, 3.0, None, False, 10)
    assert r.profile == "family" and r.party_size == 4
    assert r.options and all(o.distance_km <= 3.0 for o in r.options)
    decent = [(o.rating or 0) >= 4.0 and (o.review_count or 0) >= 50 for o in r.options]
    assert decent == sorted(decent, reverse=True)                  # decent places always come first
    for group in (True, False):                                    # and each group is ordered by score
        scores = [o.score for o, d in zip(r.options, decent) if d == group]
        assert scores == sorted(scores, reverse=True)
    assert r.options[0].labels[0] == "Top pick"
    assert all(o.estimated_meal_cost == o.estimated_per_person * 4 for o in r.options if o.estimated_per_person)
    assert r.anchor.latitude == FAMILY_BLR[0]


def test_vegetarian_only_filter_uses_listing_data():
    opts = FoodService.parse(load("food_near_hotel_family_bengaluru"))
    r = rank(base(opts), *FAMILY_BLR, "family", 2, 4, None, 20, None, True, 20)
    assert r.options and all("vegetarian_only" in o.features for o in r.options)
    assert r.hidden_count == 20 - len(r.options)


def test_meal_filter_keeps_unknown_meals_and_hides_mismatches():
    breakfast_only = place("b", meals=["breakfast"])
    dinner = place("d", meals=["dinner"])
    unknown = place("u", meals=[])
    r = rank(base([breakfast_only, dinner, unknown]), 9.0, 78.0, "budget", 0, 2, "dinner", 3.0, None, False, 10)
    assert {o.id for o in r.options} == {"d", "u"}


def test_distance_filter_and_closest_label():
    near = place("near", lat=9.001, rating=4.4, reviews=300)
    far = place("far", lat=9.2, rating=4.8, reviews=900)         # about 22 km away
    r = rank(base([near, far]), 9.0, 78.0, "budget", 0, 2, None, 3.0, None, False, 10)
    assert [o.id for o in r.options] == ["near"] and r.hidden_count == 1
    assert "Closest decent option" in r.options[0].labels


def test_cheap_unproven_place_does_not_win():
    good = place("good", rating=4.6, reviews=900, est=300)
    tiny = place("tiny", rating=5.0, reviews=3, est=100)
    r = rank(base([good, tiny]), 9.0, 78.0, "budget", 0, 2, None, 3.0, None, False, 10)
    assert r.options[0].id == "good"
    assert any("Limited review history" in x for x in next(o for o in r.options if o.id == "tiny").reasons)


def test_family_profile_values_kid_friendly():
    plain = place("plain")
    kids = place("kids", features=["kid_friendly", "family_friendly", "high_chairs"])
    r = rank(base([plain, kids]), 9.0, 78.0, "family", 2, 4, None, 3.0, None, False, 10)
    assert r.options[0].id == "kids"


def test_missing_price_is_neutral_not_free():
    priced_cheap = place("cheap", est=100)
    unpriced = place("unpriced", est=None)
    r = rank(base([priced_cheap, unpriced]), 9.0, 78.0, "budget", 0, 2, None, 3.0, None, False, 10)
    assert r.options[0].id == "cheap" and next(o for o in r.options if o.id == "unpriced").estimated_meal_cost is None


# ------------------------------ endpoint ------------------------------
class FakeClient:
    def __init__(self, payload):
        self.payload, self.calls, self.last = payload, 0, None

    async def google_maps_places(self, query, lat, lng):
        self.calls, self.last = self.calls + 1, (query, lat, lng)
        return self.payload


@pytest.fixture
def client():
    with TestClient(app) as c:
        c.fake = FakeClient(load("food_near_hotel_family_bengaluru"))
        app.state.food.client = c.fake
        yield c


def url(**extra):
    params = {"lat": FAMILY_BLR[0], "lng": FAMILY_BLR[1]}
    params.update(extra)
    return "/api/food/search?" + "&".join(f"{k}={v}" for k, v in params.items())


def test_endpoint_caches_and_filters_are_free(client):
    first = client.get(url(children=2)).json()
    second = client.get(url(children=2)).json()
    third = client.get(url(children=2, meal="dinner", maxDistanceKm=2, profile="business")).json()
    assert (first["cached"], second["cached"], third["cached"]) == (False, True, True)
    assert client.fake.calls == 1 and client.get("/api/usage").json()["serpapiCallsThisMonth"] == 1
    assert first["profile"] == "family" and third["profile"] == "business"
    top = first["options"][0]
    assert "distanceKm" in top and "estimatedMealCost" in top and first["anchor"]["latitude"] == FAMILY_BLR[0]


def test_nearby_anchors_share_one_cache_entry_and_the_rounded_point_is_sent(client):
    client.get(url())
    client.get(f"/api/food/search?lat={FAMILY_BLR[0] + 0.0001}&lng={FAMILY_BLR[1] - 0.0001}")   # about 15 m away
    assert client.fake.calls == 1
    assert client.fake.last == ("restaurants", 12.972, 77.609)
    client.get(url(category="family"))                                                        # different query
    assert client.fake.calls == 2


def test_vegetarian_only_searches_for_veg_places(client):
    client.get(url(vegetarianOnly="true"))
    assert client.fake.last[0] == "vegetarian restaurants"


def test_validation(client):
    bad = [url(category="pizza"), url(meal="brunch"), "/api/food/search?lat=95&lng=77",
           "/api/food/search?lat=12.9", url(maxDistanceKm=50), url(profile="vip")]
    for u in bad:
        assert client.get(u).status_code == 422, u
    assert client.get(url(cuisine="x;drop")).status_code == 400
    assert client.fake.calls == 0


# ------------------------------ client ------------------------------
def test_client_sends_anchor_and_query():
    seen = {}

    def handler(request):
        seen.update(dict(request.url.params))
        return httpx.Response(200, json={"local_results": []})

    http = httpx.AsyncClient(base_url="https://serpapi.com", transport=httpx.MockTransport(handler))
    asyncio.run(SerpApiClient(http, "K").google_maps_places("vegetarian restaurants", 9.936, 78.087))
    assert seen["engine"] == "google_maps" and seen["type"] == "search"
    assert seen["q"] == "vegetarian restaurants" and seen["ll"] == "@9.936,78.087,15z"
