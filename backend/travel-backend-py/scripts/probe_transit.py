"""
One-off probe: does SerpApi's Google Maps Directions return usable train/bus
options for Indian routes?  Costs 1 credit per route (3 routes by default).

Run from the project root (the folder with .env):
    python -m scripts.probe_transit

Parameter names / the travel_mode code are from my recollection of SerpApi's
docs and are UNVERIFIED. If you get an error, check the google_maps_directions
docs and adjust TRAVEL_MODE_TRANSIT below.
"""
import json
import sys
from pathlib import Path

import httpx

from app.config import get_settings

TRAVEL_MODE_TRANSIT = "3"   # unverified: my recollection is that 3 = public transit

ROUTES = [
    ("Chennai Central, Chennai", "Bengaluru City Junction, Bengaluru"),
    ("Chennai Central, Chennai", "Madurai Junction, Madurai"),
    ("Koyambedu Bus Terminus, Chennai", "Majestic Bus Station, Bengaluru"),
]

OUT_DIR = Path("probe_output")


def find_keys(obj, wanted=("vehicle", "type", "travel_mode", "line", "title", "duration"), depth=0, found=None):
    """Walk the JSON and collect values for a few interesting keys, to spot train/bus hints."""
    found = {} if found is None else found
    if depth > 8:
        return found
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in wanted and isinstance(v, (str, int, float)):
                found.setdefault(k, set()).add(v)
            find_keys(v, wanted, depth + 1, found)
    elif isinstance(obj, list):
        for item in obj:
            find_keys(item, wanted, depth + 1, found)
    return found


def main() -> None:
    key = get_settings().serpapi_key
    OUT_DIR.mkdir(exist_ok=True)

    for i, (start, end) in enumerate(ROUTES, 1):
        print(f"\n=== Route {i}: {start}  ->  {end}")
        params = {
            "engine": "google_maps_directions",
            "start_addr": start,
            "end_addr": end,
            "travel_mode": TRAVEL_MODE_TRANSIT,
            "api_key": key,
        }
        try:
            r = httpx.get("https://serpapi.com/search.json", params=params, timeout=30)
            body = r.json()
        except Exception as e:  # don't print the exception text: it can contain the URL with your key
            print("request failed:", type(e).__name__)
            continue

        path = OUT_DIR / f"route{i}.json"
        path.write_text(json.dumps(body, indent=2), encoding="utf-8")
        print(f"HTTP {r.status_code}; raw response saved to {path}")

        if body.get("error"):
            print("SerpApi error:", body["error"])
            continue

        print("top-level keys:", list(body.keys()))
        hints = find_keys(body)
        for k, vals in hints.items():
            sample = sorted(map(str, vals))[:12]
            print(f"  {k}: {sample}")


if __name__ == "__main__":
    sys.exit(main())
