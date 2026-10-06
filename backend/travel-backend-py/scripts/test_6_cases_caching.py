"""
Live Test Suite: 6 Distinct Cases & Caching Verification
Tests the FastAPI backend against SerpApi with 6 distinct real API calls,
using exactly 6 API credits (1 credit per case on first call),
and validates that the second call for each case is an instant CACHE HIT (0 credits).
"""
import time
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

FUTURE_DATE_1 = (date.today() + timedelta(days=15)).isoformat()
FUTURE_DATE_2 = (date.today() + timedelta(days=18)).isoformat()
FUTURE_DATE_3 = (date.today() + timedelta(days=25)).isoformat()
FUTURE_DATE_4 = (date.today() + timedelta(days=28)).isoformat()

CASES = [
    {
        "id": "Case 1",
        "name": "Flights (BLR -> MAA)",
        "endpoint": "/api/flights/search",
        "params": {
            "origin": "BLR",
            "destination": "MAA",
            "date": FUTURE_DATE_1,
            "adults": 1,
            "currency": "INR"
        }
    },
    {
        "id": "Case 2",
        "name": "Hotels (Pondicherry)",
        "endpoint": "/api/hotels/search",
        "params": {
            "destination": "Pondicherry",
            "checkIn": FUTURE_DATE_1,
            "checkOut": FUTURE_DATE_2,
            "adults": 2,
            "currency": "INR",
            "profile": "budget",
            "limit": 5
        }
    },
    {
        "id": "Case 3",
        "name": "Transit (Bengaluru to Mysuru)",
        "endpoint": "/api/transit/search",
        "params": {
            "origin": "Bengaluru Central, Bengaluru",
            "destination": "Mysuru Junction, Mysuru"
        }
    },
    {
        "id": "Case 4",
        "name": "Flights (DEL -> BOM Round-Trip)",
        "endpoint": "/api/flights/search",
        "params": {
            "origin": "DEL",
            "destination": "BOM",
            "date": FUTURE_DATE_3,
            "returnDate": FUTURE_DATE_4,
            "adults": 1,
            "currency": "INR"
        }
    },
    {
        "id": "Case 5",
        "name": "Hotels (Goa Beach Stays)",
        "endpoint": "/api/hotels/search",
        "params": {
            "destination": "Goa",
            "checkIn": FUTURE_DATE_3,
            "checkOut": FUTURE_DATE_4,
            "adults": 2,
            "currency": "INR",
            "limit": 5
        }
    },
    {
        "id": "Case 6",
        "name": "Food (Vegetarian near MG Road Bengaluru)",
        "endpoint": "/api/food/search",
        "params": {
            "lat": 12.9716,
            "lng": 77.5946,
            "category": "vegetarian",
            "vegetarianOnly": True,
            "limit": 5
        }
    }
]


def run_tests():
    print("=" * 80)
    print("SERPAPI BACKEND LIVE INTEGRATION & CACHE VALIDATION (6 TEST CASES)")
    print("=" * 80)

    with TestClient(app) as client:
        # Check initial quota usage
        initial_usage_res = client.get("/api/usage")
        initial_credits = initial_usage_res.json().get("serpapiCallsThisMonth", 0)
        print(f"\nInitial SerpApi Credits Recorded in Cache: {initial_credits}\n")

        results = []

        for case in CASES:
            case_id = case["id"]
            name = case["name"]
            endpoint = case["endpoint"]
            params = case["params"]

            print(f"\n--- Testing {case_id}: {name} ---")
            print(f"Endpoint: {endpoint}")
            print(f"Params: {params}")

            # ─── First Call: Live SerpApi Call (Cache Miss Expected) ───
            t0 = time.perf_counter()
            res1 = client.get(endpoint, params=params)
            t1 = time.perf_counter()
            d1_ms = (t1 - t0) * 1000

            if res1.status_code != 200:
                print(f"[FAIL] Call 1 returned HTTP {res1.status_code}: {res1.text}")
                continue

            data1 = res1.json()
            is_cached1 = data1.get("cached", False)
            options_count1 = len(data1.get("options", []))
            print(f"  Call 1 (Fresh):  cached={is_cached1} | Latency={d1_ms:.1f}ms | Options returned={options_count1}")

            # ─── Second Call: Cache Hit Verification ───
            t2 = time.perf_counter()
            res2 = client.get(endpoint, params=params)
            t3 = time.perf_counter()
            d2_ms = (t3 - t2) * 1000

            if res2.status_code != 200:
                print(f"[FAIL] Call 2 returned HTTP {res2.status_code}: {res2.text}")
                continue

            data2 = res2.json()
            is_cached2 = data2.get("cached", False)
            options_count2 = len(data2.get("options", []))
            speedup = d1_ms / max(d2_ms, 0.01)
            print(f"  Call 2 (Cached): cached={is_cached2} | Latency={d2_ms:.1f}ms | Options returned={options_count2} | Speedup: {speedup:.1f}x")

            # Check quota after this case
            usage_res = client.get("/api/usage")
            current_credits = usage_res.json().get("serpapiCallsThisMonth", 0)

            results.append({
                "case": case_id,
                "name": name,
                "call1_cached": is_cached1,
                "call1_ms": d1_ms,
                "call2_cached": is_cached2,
                "call2_ms": d2_ms,
                "speedup": speedup,
                "options": options_count1,
                "credits_after": current_credits
            })

        # Final quota check
        final_usage_res = client.get("/api/usage")
        final_credits = final_usage_res.json().get("serpapiCallsThisMonth", 0)
        credits_used = final_credits - initial_credits

        print("\n" + "=" * 80)
        print("SUMMARY RESULTS")
        print("=" * 80)
        print(f"{'Case':<8} | {'Feature':<32} | {'Call 1 (Fresh)':<15} | {'Call 2 (Cache)':<15} | {'Speedup':<8}")
        print("-" * 80)
        for r in results:
            c1_str = f"{'MISS' if not r['call1_cached'] else 'HIT'} ({r['call1_ms']:.0f}ms)"
            c2_str = f"{'HIT' if r['call2_cached'] else 'MISS'} ({r['call2_ms']:.1f}ms)"
            print(f"{r['case']:<8} | {r['name']:<32} | {c1_str:<15} | {c2_str:<15} | {r['speedup']:.0f}x")

        print("-" * 80)
        print(f"Total API Credits Consumed in Test: {credits_used} credit(s)")
        print(f"All 6 calls successfully cached on 2nd query: {all(r['call2_cached'] for r in results)}")
        print("=" * 80)


if __name__ == "__main__":
    run_tests()
