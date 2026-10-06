"""
One-off probe: what does SerpApi's Google Maps engine return for restaurants?
Costs 1 credit per case (3 cases = 3 credits).

Run from the project root (the folder with .env):
    python -m scripts.probe_food

Case 2 and 3 search NEAR a hotel's coordinates, taken from the hotel fixtures
already saved in tests/fixtures, because that is how the product will use it
("where to eat near the hotel I picked").

Parameter names (engine=google_maps, type=search, ll="@lat,lng,zoom") are from my
recollection of SerpApi's docs and are UNVERIFIED. If a case errors, check the
google_maps docs and adjust CASES.

Saved JSON has your API key redacted, but search the files for it anyway before
sharing them. Never screenshot your .env.
"""
import json
from pathlib import Path

import httpx

from app.config import get_settings

OUT_DIR = Path("probe_output")
FIX = Path("tests/fixtures")


def hotel_coords(fixture: str, fallback: tuple[float, float]) -> tuple[float, float]:
    """First hotel with coordinates from a saved hotel response, else a rough city-centre fallback."""
    try:
        props = json.loads((FIX / fixture).read_text(encoding="utf-8"))["properties"]
        for p in props:
            g = p.get("gps_coordinates")
            if p.get("type") == "hotel" and g:
                return g["latitude"], g["longitude"]
    except Exception:
        pass
    return fallback


MADURAI = hotel_coords("hotels_couple_madurai.json", (9.9252, 78.1198))
BENGALURU = hotel_coords("hotels_family_bengaluru.json", (12.9716, 77.5946))

CASES = [
    ("city_madurai", {"q": "restaurants in Madurai"}),
    ("near_hotel_veg_madurai", {"q": "vegetarian restaurants", "ll": f"@{MADURAI[0]},{MADURAI[1]},15z"}),
    ("near_hotel_family_bengaluru", {"q": "family restaurants", "ll": f"@{BENGALURU[0]},{BENGALURU[1]},15z"}),
]


def redact(obj, secret):
    if isinstance(obj, dict):
        return {k: redact(v, secret) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact(v, secret) for v in obj]
    if isinstance(obj, str) and secret in obj:
        return obj.replace(secret, "REDACTED")
    return obj


def short(v, n=160):
    s = json.dumps(v, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "..."


def main() -> None:
    key = get_settings().serpapi_key
    OUT_DIR.mkdir(exist_ok=True)

    for name, extra in CASES:
        print(f"\n=== {name}: {extra}")
        params = {"engine": "google_maps", "type": "search", "hl": "en", "gl": "in",
                  "api_key": key, **extra}
        try:
            r = httpx.get("https://serpapi.com/search.json", params=params, timeout=40)
            body = r.json()
        except Exception as e:   # don't print the exception text: it can contain the URL with your key
            print("request failed:", type(e).__name__)
            continue

        path = OUT_DIR / f"food_{name}.json"
        path.write_text(json.dumps(redact(body, key), indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"HTTP {r.status_code}; saved to {path}")

        if body.get("error"):
            print("SerpApi error:", body["error"])
            continue

        print("top-level keys:", list(body.keys()))
        results = body.get("local_results") or []
        print("number of local_results:", len(results))
        if results:
            p = results[0]
            print("first result keys:", list(p.keys()))
            for field in ("title", "type", "types", "rating", "reviews", "price", "address",
                          "gps_coordinates", "open_state", "hours", "operating_hours",
                          "service_options", "phone", "website", "place_id", "data_id"):
                if field in p:
                    print(f"  {field}: {short(p[field])}")
        for k in ("serpapi_pagination", "search_information"):
            if k in body:
                print(f"{k}: {short(body[k], 220)}")


if __name__ == "__main__":
    main()
    