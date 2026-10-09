from datetime import date

import httpx


class UpstreamError(Exception):
    pass


class SerpApiClient:
    """The ONLY place that talks to SerpApi. Parameter names were confirmed against real
    responses for google_flights, google_maps_directions and google_hotels; SerpApi may change them."""

    def __init__(self, http: httpx.AsyncClient, api_key: str) -> None:
        self._http = http
        self._api_key = api_key

    def _clean(self, text: str) -> str:
        """Safe to show: key removed, length capped."""
        return text.replace(self._api_key, "***")[:200]

    async def _search(self, params: dict, empty_ok: tuple[str, ...] = ()) -> dict:
        """Shared call. Errors say WHAT went wrong (status, SerpApi's message, error class) but never
        include the raw exception text, because that can contain the URL with the API key."""
        try:
            resp = await self._http.get("/search.json", params={**params, "api_key": self._api_key})
            resp.raise_for_status()
            body = resp.json()
        except httpx.HTTPStatusError as e:
            detail = ""
            try:
                detail = str(e.response.json().get("error") or "")
            except Exception:
                pass
            raise UpstreamError(f"SerpApi returned HTTP {e.response.status_code}"
                                + (f": {self._clean(detail)}" if detail else "")) from None
        except httpx.TimeoutException:
            raise UpstreamError("SerpApi request timed out") from None
        except httpx.HTTPError as e:
            raise UpstreamError(f"SerpApi request failed ({type(e).__name__})") from None
        except ValueError:
            raise UpstreamError("SerpApi returned an unreadable response") from None

        if isinstance(body, dict) and body.get("error"):
            message = str(body["error"])
            if any(phrase in message.lower() for phrase in empty_ok):
                return {}          # "no results" is a valid answer, not a failure
            raise UpstreamError(f"SerpApi error: {self._clean(message)}")
        return body

    async def google_flights(self, origin: str, destination: str, outbound: date,
                             return_date: date | None, adults: int, currency: str, children: int = 0) -> dict:
        params = {
            "engine": "google_flights",
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": outbound.isoformat(),
            "type": 1 if return_date else 2,   # 1 round trip, 2 one way
            "adults": adults,
            "children": children,
            "currency": currency,
            "hl": "en",
        }
        if return_date:
            params["return_date"] = return_date.isoformat()
        return await self._search(params)

    async def google_maps_transit(self, origin: str, destination: str) -> dict:
        """Google Maps Directions in public-transit mode (travel_mode 3)."""
        return await self._search({
            "engine": "google_maps_directions",
            "start_addr": origin,
            "end_addr": destination,
            "travel_mode": "3",
            "hl": "en",
        })

    async def google_hotels(self, query: str, check_in: date, check_out: date, adults: int,
                            child_ages: list[int], currency: str, country_code: str = "in") -> dict:
        """First page only (about 20 properties). Fetching more pages would cost more credits."""
        params = {
            "engine": "google_hotels",
            "q": query,
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "adults": adults,
            "currency": currency,
            "hl": "en",
            "gl": country_code.lower(),
        }
        if child_ages:
            params["children"] = len(child_ages)
            params["children_ages"] = ",".join(str(a) for a in child_ages)
        # the "no results" wording is an assumption: verify it if you ever see a 502 for an obscure town
        return await self._search(params, empty_ok=("any results",))

    async def airbnb(self, query: str, check_in: date, check_out: date,
                     adults: int, children: int, currency: str) -> dict:
        return await self._search({
            "engine": "airbnb",
            "q": query,
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "adults": adults,
            "children": children,
            "currency": currency,
            "hl": "en",
            "gl": "in",
        }, empty_ok=("no results", "any results"))

    async def google_maps_places(self, query: str, lat: float, lng: float) -> dict:
        """Google Maps local search anchored on a point. First page only (about 20 places).
        The anchor ("ll") matters: in the saved probes, searches WITHOUT it came back with fewer
        fields (no price band, no service options)."""
        return await self._search({
            "engine": "google_maps",
            "type": "search",
            "q": query,
            "ll": f"@{lat},{lng},15z",
            "hl": "en",
            "gl": "in",
        }, empty_ok=("any results",))

    async def tripadvisor(self, query: str, ssrc: str = "h") -> dict:
        """TripAdvisor search engine for destination recommendations and stays."""
        return await self._search({
            "engine": "tripadvisor",
            "q": query,
            "ssrc": ssrc,
            "hl": "en",
        }, empty_ok=("any results", "no results"))
