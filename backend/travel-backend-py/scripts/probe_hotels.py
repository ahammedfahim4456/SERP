"""
One-off probe: what does SerpApi's Google Hotels engine actually return?
Costs 1 credit per case (3 cases by default = 3 credits).

Run from the project root (the folder with .env):
    python -m scripts.probe_hotels

Parameter names (q, check_in_date, check_out_date, adults, children,
children_ages, currency) are from my recollection of SerpApi's docs and are
UNVERIFIED. If a case errors, check the google_hotels docs and adjust CASES.

Saved JSON has your API key redacted, but search the files for it anyway
before sharing them.
"""
import json
from datetime import date, timedelta
from pathlib import Path

import httpx

from app.config import get_settings

CHECK_IN = date.today() + timedelta(days=30)
CHECK_OUT = CHECK_IN + timedelta(days=2)       # 2 nights
OUT_DIR = Path("probe_output")

CASES = [
    ("business_bengaluru", {"q": "Hotels in Bengaluru", "adults": 1}),
    ("couple_madurai", {"q": "Hotels in Madurai", "adults": 2}),
    ("family_bengaluru", {"q": "Hotels in Bengaluru", "adults": 2, "children": 2, "children_ages": "5,8"}),
]


def redact(obj, secret):
    """Replace the API key anywhere in the JSON, in keys' values or inside URLs."""
    if isinstance(obj, dict):
        return {k: redact(v, secret) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact(v, secret) for v in obj]
    if isinstance(obj, str) and secret in obj:
        return obj.replace(secret, "REDACTED")
    return obj


def short(v, n=140):
    s = json.dumps(v, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "..."


def main() -> None:
    key = get_settings().serpapi_key
    OUT_DIR.mkdir(exist_ok=True)

    for name, extra in CASES:
        print(f"\n=== {name}: {extra}")
        params = {
            "engine": "google_hotels",
            "check_in_date": CHECK_IN.isoformat(),
            "check_out_date": CHECK_OUT.isoformat(),
            "currency": "INR",
            "hl": "en",
            "gl": "in",
            "api_key": key,
            **extra,
        }
        try:
            r = httpx.get("https://serpapi.com/search.json", params=params, timeout=40)
            body = r.json()
        except Exception as e:   # don't print the exception text: it can contain the URL with your key
            print("request failed:", type(e).__name__)
            continue

        path = OUT_DIR / f"hotels_{name}.json"
        path.write_text(json.dumps(redact(body, key), indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"HTTP {r.status_code}; saved to {path}")

        if body.get("error"):
            print("SerpApi error:", body["error"])
            continue

        print("top-level keys:", list(body.keys()))
        props = body.get("properties") or []
        print("number of properties:", len(props))
        if props:
            p = props[0]
            print("first property keys:", list(p.keys()))
            for field in ("name", "type", "hotel_class", "overall_rating", "reviews",
                          "location_rating", "rate_per_night", "total_rate"):
                if field in p:
                    print(f"  {field}: {short(p[field])}")
            for field in ("amenities", "prices", "nearby_places", "essential_info"):
                if field in p:
                    print(f"  {field}: {len(p[field])} items, e.g. {short(p[field][:2])}")
        for k in ("brands", "serpapi_pagination", "search_information"):
            if k in body:
                print(f"{k}: {short(body[k], 200)}")


if __name__ == "__main__":
    main()
