import hashlib
import json
import logging
import os
import time
from datetime import date
from pathlib import Path
from typing import Any

import httpx

from .quota import QuotaGuard

log = logging.getLogger("serpapi")
RAW_CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


class UpstreamError(Exception):
    pass


class SerpApiClient:
    """The ONLY place that talks to SerpApi. Parameter names were confirmed against real
    responses for google_flights, google_maps_directions and google_hotels; SerpApi may change them."""

    def __init__(self, http: httpx.AsyncClient, api_key: str) -> None:
        self._http = http
        self._api_key = api_key
        self._raw_cache: dict[str, tuple[dict[str, Any], float]] = {}

    def _clean(self, text: str) -> str:
        """Safe to show: key removed, length capped."""
        return text.replace(self._api_key, "***")[:200]

    async def _search(
        self,
        params: dict[str, Any],
        empty_ok: tuple[str, ...] = (),
        persistent_ttl_seconds: int | None = None,
        quota: QuotaGuard | None = None,
    ) -> dict[str, Any]:
        """Shared call. Errors say WHAT went wrong (status, SerpApi's message, error class) but never
        include the raw exception text, because that can contain the URL with the API key."""
        cache_key: str | None = None
        cache_path: Path | None = None
        if persistent_ttl_seconds is not None:
            serialized = json.dumps(params, sort_keys=True, separators=(",", ":"))
            cache_key = hashlib.md5(serialized.encode("utf-8")).hexdigest()
            now = time.time()
            memory_entry = self._raw_cache.get(cache_key)
            if memory_entry and memory_entry[1] > now:
                return memory_entry[0]
            cache_path = RAW_CACHE_DIR / f"{cache_key}.json"
            try:
                cached = json.loads(cache_path.read_text(encoding="utf-8"))
                if now - float(cached["cachedAtEpoch"]) < persistent_ttl_seconds:
                    body = cached["response"]
                    if isinstance(body, dict):
                        self._raw_cache[cache_key] = (body, now + persistent_ttl_seconds)
                        return body
                cache_path.unlink(missing_ok=True)
            except FileNotFoundError:
                pass
            except (OSError, ValueError, KeyError, TypeError):
                log.warning("Ignoring invalid raw SerpApi cache file %s", cache_path.name)

        if quota is not None:
            await quota.ensure_available()
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
                body = {}  # "no results" is a valid answer, not a failure
            else:
                raise UpstreamError(f"SerpApi error: {self._clean(message)}")
        if not isinstance(body, dict):
            raise UpstreamError("SerpApi returned an unreadable response")
        if quota is not None:
            await quota.record_call()
        if cache_key is not None and cache_path is not None:
            now = time.time()
            assert persistent_ttl_seconds is not None
            self._raw_cache[cache_key] = (body, now + persistent_ttl_seconds)
            try:
                RAW_CACHE_DIR.mkdir(parents=True, exist_ok=True)
                temp_path = cache_path.with_suffix(f".{os.getpid()}.tmp")
                temp_path.write_text(
                    json.dumps({"cachedAtEpoch": now, "response": body}, ensure_ascii=False),
                    encoding="utf-8",
                )
                temp_path.replace(cache_path)
            except OSError as exc:
                log.error(
                    "Could not persist raw SerpApi response (%s)",
                    type(exc).__name__,
                )
        return body

    async def google_flights(self, origin: str, destination: str, outbound: date,
                             return_date: date | None, adults: int, currency: str) -> dict:
        params = {
            "engine": "google_flights",
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": outbound.isoformat(),
            "type": 1 if return_date else 2,   # 1 round trip, 2 one way
            "adults": adults,
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

    async def google_hotels(
        self,
        query: str,
        check_in: date,
        check_out: date,
        adults: int,
        child_ages: list[int],
        currency: str,
        persistent_ttl_seconds: int | None = None,
        quota: QuotaGuard | None = None,
    ) -> dict[str, Any]:
        """First page only (about 20 properties). Fetching more pages would cost more credits."""
        params = {
            "engine": "google_hotels",
            "q": query,
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "adults": adults,
            "currency": currency,
            "hl": "en",
            "gl": "in",
        }
        if child_ages:
            params["children"] = len(child_ages)
            params["children_ages"] = ",".join(str(a) for a in child_ages)
        # the "no results" wording is an assumption: verify it if you ever see a 502 for an obscure town
        return await self._search(
            params,
            empty_ok=("any results",),
            persistent_ttl_seconds=persistent_ttl_seconds,
            quota=quota,
        )

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

    async def google_maps_places(
        self,
        query: str,
        lat: float,
        lng: float,
        zoom: int = 15,
        persistent_ttl_seconds: int | None = None,
        quota: QuotaGuard | None = None,
    ) -> dict[str, Any]:
        """Google Maps local search anchored on a point. First page only (about 20 places).
        The anchor ("ll") matters: in the saved probes, searches WITHOUT it came back with fewer
        fields (no price band, no service options)."""
        return await self._search({
            "engine": "google_maps",
            "type": "search",
            "q": query,
            "ll": f"@{lat},{lng},{zoom}z",
            "hl": "en",
            "gl": "in",
        },
            empty_ok=("any results",),
            persistent_ttl_seconds=persistent_ttl_seconds,
            quota=quota,
        )

    async def google_events(
        self,
        query: str,
        persistent_ttl_seconds: int | None = None,
        quota: QuotaGuard | None = None,
    ) -> dict[str, Any]:
        return await self._search(
            {"engine": "google_events", "q": query, "hl": "en", "gl": "in"},
            empty_ok=("any results", "no results"),
            persistent_ttl_seconds=persistent_ttl_seconds,
            quota=quota,
        )

    async def tripadvisor(self, query: str, ssrc: str = "h") -> dict:
        """TripAdvisor search engine for destination recommendations and stays."""
        return await self._search({
            "engine": "tripadvisor",
            "q": query,
            "ssrc": ssrc,
            "hl": "en",
        }, empty_ok=("any results", "no results"))
