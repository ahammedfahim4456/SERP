import asyncio
from datetime import date

import httpx
import pytest

from app.serpapi_client import SerpApiClient, UpstreamError

KEY = "SECRETKEY123"


def make_client(handler):
    http = httpx.AsyncClient(base_url="https://serpapi.com", transport=httpx.MockTransport(handler))
    return SerpApiClient(http, KEY)


def run(coro):
    return asyncio.run(coro)


def test_hotels_request_params():
    seen = {}

    def handler(request):
        seen.update(dict(request.url.params))
        return httpx.Response(200, json={"properties": []})

    run(make_client(handler).google_hotels("Hotels in Madurai", date(2026, 11, 5), date(2026, 11, 7), 2, [5, 8], "INR"))
    assert seen["engine"] == "google_hotels" and seen["q"] == "Hotels in Madurai"
    assert seen["children"] == "2" and seen["children_ages"] == "5,8"
    assert seen["check_in_date"] == "2026-11-05" and seen["api_key"] == KEY


def test_no_children_params_when_no_children():
    seen = {}

    def handler(request):
        seen.update(dict(request.url.params))
        return httpx.Response(200, json={})

    run(make_client(handler).google_hotels("Hotels in X", date(2026, 11, 5), date(2026, 11, 7), 1, [], "INR"))
    assert "children" not in seen and "children_ages" not in seen


def test_network_error_does_not_leak_the_key():
    def handler(request):
        raise httpx.ConnectError(f"boom {request.url}")

    with pytest.raises(UpstreamError) as e:
        run(make_client(handler).google_hotels("Hotels in X", date(2026, 11, 5), date(2026, 11, 7), 1, [], "INR"))
    assert KEY not in str(e.value) and KEY not in repr(e.value.__cause__)


def test_http_error_reports_status_and_serpapi_message_but_never_the_key():
    def handler(request):
        return httpx.Response(400, json={"error": f"Invalid parameter. key was {KEY}"})

    with pytest.raises(UpstreamError) as e:
        run(make_client(handler).google_hotels("Hotels in X", date(2026, 11, 5), date(2026, 11, 7), 1, [], "INR"))
    msg = str(e.value)
    assert "HTTP 400" in msg and "Invalid parameter" in msg and KEY not in msg


def test_timeout_and_network_errors_are_distinguishable():
    def timeout(request):
        raise httpx.ReadTimeout("slow")

    def refused(request):
        raise httpx.ConnectError("refused")

    with pytest.raises(UpstreamError, match="timed out"):
        run(make_client(timeout).google_maps_transit("A", "B"))
    with pytest.raises(UpstreamError, match="ConnectError"):
        run(make_client(refused).google_maps_transit("A", "B"))


def test_http_error_status_does_not_leak_the_key():
    with pytest.raises(UpstreamError) as e:
        run(make_client(lambda r: httpx.Response(500, json={})).google_maps_transit("A", "B"))
    assert KEY not in str(e.value)


def test_hotels_no_results_is_empty_not_an_error_but_flights_still_raise():
    handler = lambda r: httpx.Response(200, json={"error": "Google Hotels hasn't returned any results for this query."})
    assert run(make_client(handler).google_hotels("Hotels in X", date(2026, 11, 5), date(2026, 11, 7), 1, [], "INR")) == {}
    with pytest.raises(UpstreamError):
        run(make_client(handler).google_flights("MAA", "BLR", date(2026, 11, 5), None, 1, "INR"))
