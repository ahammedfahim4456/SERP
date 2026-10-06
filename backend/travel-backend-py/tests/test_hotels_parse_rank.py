"""Parser + ranking tests on REAL saved SerpApi responses: zero credits."""
import json
from datetime import date, datetime, timezone
from pathlib import Path

import pytest

from app.hotel_ranking import PROFILES, adjusted_rating, rank
from app.hotels import HotelService, parse_child_ages
from app.schemas import HotelOption, HotelSearchResponse

FIX = Path(__file__).parent / "fixtures"


def load(name):
    return json.loads((FIX / f"{name}.json").read_text(encoding="utf-8"))


def base_response(options, adults=2, children=0):
    return HotelSearchResponse(
        cached=False, fetched_at=datetime.now(timezone.utc), destination="X",
        check_in=date(2026, 11, 5), check_out=date(2026, 11, 7), nights=2,
        adults=adults, children=children, total_found=len(options), options=options)


def make(id, price, rating=4.5, reviews=500, **kw):
    return HotelOption(id=id, name=id, kind=kw.pop("kind", "hotel"), currency="INR", nights=2,
                       total_price=price, price_per_night=price // 2, rating=rating,
                       review_count=reviews, **kw)


# ------------------------------ parsing ------------------------------
def test_parse_rental_with_cancellation_and_sleeps():
    opts = HotelService.parse(load("hotels_business_bengaluru"), "INR", 2)
    assert len(opts) == 20
    first = opts[0]
    assert first.kind == "rental" and first.sleeps == 2 and first.bedrooms == 1
    assert (first.price_per_night, first.total_price) == (1508, 3016)
    assert first.free_cancellation is True
    assert [s.name for s in first.booking_sources] == ["Bluepillow.co.uk"]
    assert {"wifi", "parking", "kitchen"} <= set(first.features)


def test_parse_hostel_detection_and_airport_minutes():
    opts = HotelService.parse(load("hotels_business_bengaluru"), "INR", 2)
    hostels = {o.name for o in opts if o.hostel_like}
    assert "goSTOPS Bengaluru, Jayanagar" in hostels
    gostops = next(o for o in opts if o.name.startswith("goSTOPS"))
    assert gostops.airport_taxi_minutes == 71            # "1 hr 11 min"
    assert gostops.price_per_night == 381 and gostops.total_price == 762
    assert gostops.star_class is None                    # not every property has a star class


def test_parse_taxes_and_deal():
    opts = HotelService.parse(load("hotels_couple_madurai"), "INR", 2)
    heritage = next(o for o in opts if o.name == "Heritage Madurai")
    assert heritage.total_price == 18739 and heritage.total_price_before_taxes == 15496
    assert heritage.deal == "Great Deal: 36% less than usual"
    # tax breakdown is not always present: the Bengaluru search has none at all
    bengaluru = HotelService.parse(load("hotels_business_bengaluru"), "INR", 2)
    assert all(o.total_price_before_taxes is None for o in bengaluru)


def test_parse_unpriced_properties_are_kept_but_null():
    opts = HotelService.parse(load("hotels_family_bengaluru"), "INR", 2)
    assert len(opts) == 20
    assert sum(o.total_price is None for o in opts) == 9


def test_parse_child_ages():
    assert parse_child_ages(None, 0) == []
    assert parse_child_ages("5,8", 2) == [5, 8]
    for bad, n in [(None, 2), ("5", 2), ("a,b", 2), ("5,30", 2)]:
        with pytest.raises(ValueError):
            parse_child_ages(bad, n)


# ------------------------------ ranking ------------------------------
def test_profile_weights_sum_to_one():
    for p in PROFILES.values():
        assert abs(sum(p.weights.values()) - 1.0) < 1e-9


def test_adjusted_rating_punishes_tiny_review_counts():
    assert adjusted_rating(5.0, 3, 4.0) < adjusted_rating(4.6, 2000, 4.0)


def test_ranking_on_real_family_search():
    opts = HotelService.parse(load("hotels_family_bengaluru"), "INR", 2)
    r = rank(base_response(opts, adults=2, children=2), None, None, False, 10)
    assert r.profile == "family"                         # default when children > 0
    assert r.unpriced_count == 9
    assert r.hidden_count == 2
    assert r.options and all(o.total_price is not None for o in r.options)
    assert all(not o.hostel_like for o in r.options)
    assert all(o.sleeps is None or o.sleeps >= 4 for o in r.options)   # apartments must fit 4 people
    scores = [o.score for o in r.options]
    assert scores == sorted(scores, reverse=True) and all(0 <= s <= 100 for s in scores)
    assert r.options[0].labels[0] == "Top pick"
    assert all(o.reasons for o in r.options)


def test_business_profile_hides_rentals_by_default_and_flag_overrides():
    opts = HotelService.parse(load("hotels_business_bengaluru"), "INR", 2)
    default = rank(base_response(opts, adults=1), "business", None, False, 20)
    assert all(o.kind == "hotel" for o in default.options)
    with_rentals = rank(base_response(opts, adults=1), "business", True, False, 20)
    assert any(o.kind == "rental" for o in with_rentals.options)


def test_hostels_only_appear_when_requested():
    opts = HotelService.parse(load("hotels_business_bengaluru"), "INR", 2)
    assert not any(o.hostel_like for o in rank(base_response(opts, adults=1), "budget", None, False, 20).options)
    assert any(o.hostel_like for o in rank(base_response(opts, adults=1), "budget", None, True, 20).options)


def test_cost_and_quality_drive_budget_profile_on_synthetic_data():
    opts = [make("cheap-good", 2000, 4.6, 900), make("pricey-good", 9000, 4.7, 900),
            make("cheap-tiny-5star", 1500, 5.0, 3), make("cheap-bad", 1800, 3.0, 800)]
    r = rank(base_response(opts), "budget", None, False, 10)
    assert r.options[0].id == "cheap-good"
    ids = [o.id for o in r.options]
    assert ids.index("cheap-good") < ids.index("cheap-tiny-5star")      # 3 reviews can't win on a 5.0
    tiny = next(o for o in r.options if o.id == "cheap-tiny-5star")
    assert any("Limited review history" in reason for reason in tiny.reasons)
    cheapest_decent = next(o for o in r.options if "Cheapest decent option" in o.labels)
    assert cheapest_decent.id == "cheap-good"                           # 1500 has too few reviews, 1800 too low rating


def test_family_profile_values_kid_friendly_amenities():
    plain = make("plain", 5000, 4.5, 800)
    kids = make("kids", 5000, 4.5, 800, features=["kid_friendly", "free_breakfast", "pool"])
    r = rank(base_response([plain, kids], adults=2, children=2), "family", None, False, 10)
    assert r.options[0].id == "kids"


def test_apartment_too_small_is_hidden():
    small = make("small-flat", 2000, kind="rental", sleeps=2)
    r = rank(base_response([small, make("room", 4000)], adults=2, children=2), "family", None, False, 10)
    assert [o.id for o in r.options] == ["room"] and r.hidden_count == 1


def test_empty_after_filtering_is_not_an_error():
    r = rank(base_response([make("flat", 2000, kind="rental", sleeps=1)], adults=2), "business", None, False, 10)
    assert r.options == [] and r.hidden_count == 1
