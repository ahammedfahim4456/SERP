import logging
import re
from datetime import date, datetime, timezone
from typing import Any

from .normalizer import normalize_location
from .quota import QuotaGuard
from .schemas import AirbnbOption, AirbnbSearchResponse
from .serpapi_client import SerpApiClient

log = logging.getLogger("airbnb")
MAX_NIGHTS = 30


class AirbnbService:
    def __init__(self, client: SerpApiClient, cache, quota: QuotaGuard, ttl_seconds: int) -> None:
        self.client = client
        self.cache = cache
        self.quota = quota
        self.ttl_seconds = ttl_seconds

    async def search(self, destination: str, check_in: date, check_out: date,
                     adults: int, children: int, currency: str) -> AirbnbSearchResponse:
        loc = normalize_location(destination)
        currency = currency.upper()
        nights = (check_out - check_in).days
        if check_in < date.today():
            raise ValueError("checkIn must not be in the past")
        if nights < 1:
            raise ValueError("checkOut must be after checkIn")
        if nights > MAX_NIGHTS:
            raise ValueError(f"stays longer than {MAX_NIGHTS} nights are not supported")

        key = ":".join(["airbnb", loc.canonical_id, check_in.isoformat(), check_out.isoformat(),
                        str(adults), str(children), currency])
        hit = await self.cache.get(key)
        if hit:
            try:
                return AirbnbSearchResponse.model_validate_json(hit).model_copy(update={"cached": True})
            except ValueError:
                log.warning("bad cache entry for %s, refetching", key)

        await self.quota.ensure_available()
        raw = await self.client.airbnb(
            f"places to stay in {loc.display_name}", check_in, check_out, adults, children, currency)
        await self.quota.record_call()
        options = self.parse(raw, currency)
        response = AirbnbSearchResponse(
            cached=False,
            fetched_at=datetime.now(timezone.utc),
            destination=loc.display_name,
            check_in=check_in,
            check_out=check_out,
            adults=adults,
            children=children,
            total_found=len(options),
            options=options,
        )
        await self.cache.set(key, response.model_dump_json(), self.ttl_seconds)
        return response

    @staticmethod
    def _amount(value: Any) -> int | None:
        if isinstance(value, dict):
            for key in ("extracted_total", "extracted_price", "extracted", "amount", "value", "total"):
                if key in value:
                    amount = AirbnbService._amount(value[key])
                    if amount is not None:
                        return amount
            return None
        if isinstance(value, (int, float)):
            return round(value)
        if isinstance(value, str):
            digits = re.sub(r"[^\d.]", "", value.replace(",", ""))
            try:
                return round(float(digits)) if digits else None
            except ValueError:
                return None
        return None

    @staticmethod
    def _rating(value: Any) -> float | None:
        if isinstance(value, dict):
            value = value.get("value") or value.get("rating")
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _image(item: dict[str, Any]) -> str | None:
        image = item.get("thumbnail") or item.get("image") or item.get("thumbnail_url")
        if isinstance(image, dict):
            image = image.get("url") or image.get("src") or image.get("link")
        if isinstance(image, str):
            return image
        images = item.get("images") or item.get("photos") or []
        if images and isinstance(images[0], str):
            return images[0]
        if images and isinstance(images[0], dict):
            return images[0].get("url") or images[0].get("src") or images[0].get("link")
        return None

    @staticmethod
    def parse(raw: dict[str, Any], currency: str) -> list[AirbnbOption]:
        properties = raw.get("properties") or raw.get("search_results") or raw.get("results") or []
        options = []
        for item in properties:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or item.get("title") or item.get("listing_title")
            if not name:
                continue
            price = item.get("price")
            nightly = item.get("price_per_night") or item.get("nightly_price")
            total = item.get("total_price") or item.get("total")
            if isinstance(price, dict):
                nightly = nightly or price.get("rate") or price.get("per_night")
                total = total or price.get("total") or price.get("stay_total")
            options.append(AirbnbOption(
                id=str(item.get("id") or item.get("listing_id") or item.get("property_id") or name),
                name=str(name),
                property_type=item.get("property_type") or item.get("type"),
                room_type=item.get("room_type"),
                image_url=AirbnbService._image(item),
                listing_url=item.get("link") or item.get("url"),
                rating=AirbnbService._rating(item.get("rating")),
                review_count=AirbnbService._amount(item.get("reviews") or item.get("review_count")),
                price_per_night=AirbnbService._amount(nightly),
                total_price=AirbnbService._amount(total),
                currency=str(item.get("currency") or currency),
                bedrooms=AirbnbService._amount(item.get("bedrooms")),
                beds=AirbnbService._amount(item.get("beds")),
                bathrooms=AirbnbService._amount(item.get("bathrooms")),
            ))
        return options
