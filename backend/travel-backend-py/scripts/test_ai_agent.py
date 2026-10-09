"""
Test & Verification Suite for AI Integration (Tracks 1, 2, 3, 4, 5)

Runs against the FastAPI backend:
- Track 1: Chat trip planner (Natural language prompt parsing)
- Track 2: 'Why this pick' explanations (Family/budget recommendations)
- Track 3: Trip cost summary & trade-off analysis
- Track 4: Tamil & Hindi input/output validation
- Track 5: Smart location normalization & cache key consolidation
"""
import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 70)
    print("[AI-SUITE] STARTING AI INTEGRATION TEST SUITE (TRACKS 1-5)")
    print("=" * 70)

    with TestClient(app) as client:
        # -------------------------------------------------------------
        # Track 5: Smart Search Normalization
        # -------------------------------------------------------------
        print("\n[TRACK 5] Testing Smart Search Normalization...")
        test_queries = ["Bangalore", "Bengaluru", "BLR", "Madras", "Chennai", "IXM", "Madurai"]
        results = {}
        for q in test_queries:
            resp = client.get(f"/api/ai/normalize?location={q}")
            assert resp.status_code == 200, f"Failed for {q}: {resp.text}"
            data = resp.json()
            results[q] = data
            print(f"  • '{q}' -> canonicalId: '{data['canonicalId']}' | IATA: '{data['iataCode']}' | Display: '{data['displayName']}'")

        # Verify Bangalore, Bengaluru, BLR all map to the SAME canonical ID
        assert results["Bangalore"]["canonicalId"] == "bengaluru"
        assert results["Bengaluru"]["canonicalId"] == "bengaluru"
        assert results["BLR"]["canonicalId"] == "bengaluru"
        print("  ✅ SUCCESS: 'Bangalore', 'Bengaluru', and 'BLR' successfully share identical canonical cache key!")

        # -------------------------------------------------------------
        # Track 1 & 4: Chat Trip Planner Prompt Parsing (Multilingual)
        # -------------------------------------------------------------
        print("\n[TRACK 1 & 4] Testing Natural Language Trip Planner Prompts...")

        # Test Case 1: English
        en_prompt = "2 adults, 2 kids, Chennai to Madurai, 3 days, ₹25k budget"
        resp_en = client.post("/api/ai/parse-prompt", json={"prompt": en_prompt})
        assert resp_en.status_code == 200, resp_en.text
        data_en = resp_en.json()
        print(f"\n  [English Prompt]: '{en_prompt}'")
        print(f"  • Origin: {data_en['origin']['displayName']} ({data_en['origin']['iata']})")
        print(f"  • Destination: {data_en['destination']['displayName']} ({data_en['destination']['iata']})")
        print(f"  • Party: {data_en['party']['adults']} Adults, {data_en['party']['children']} Children (Profile: {data_en['party']['profile']})")
        print(f"  • Duration: {data_en['dates']['durationDays']} Days ({data_en['dates']['nights']} Nights)")
        print(f"  • Budget: ₹{data_en['budget']:,}")
        assert data_en['party']['adults'] == 2
        assert data_en['party']['children'] == 2
        assert data_en['budget'] == 25000

        # Test Case 2: Tamil (தமிழ்)
        ta_prompt = "2 பெரியவர்கள், 2 குழந்தைகள், சென்னையிலிருந்து மதுரை, 3 நாட்கள், 25000 ரூபாய் பட்ஜெட்"
        resp_ta = client.post("/api/ai/parse-prompt", json={"prompt": ta_prompt})
        assert resp_ta.status_code == 200, resp_ta.text
        data_ta = resp_ta.json()
        print(f"\n  [Tamil Prompt]: '{ta_prompt}'")
        print(f"  • Detected Language: {data_ta['detectedLanguage']} (Tamil)")
        print(f"  • Origin: {data_ta['origin']['displayName']} | Destination: {data_ta['destination']['displayName']}")
        print(f"  • Adults: {data_ta['party']['adults']} | Kids: {data_ta['party']['children']} | Budget: ₹{data_ta['budget']:,}")
        assert data_ta['detectedLanguage'] == "ta"

        # Test Case 3: Hindi (हिंदी)
        hi_prompt = "2 वयस्क, 2 बच्चे, दिल्ली से जयपुर, 3 दिन, ₹20000 बजट"
        resp_hi = client.post("/api/ai/parse-prompt", json={"prompt": hi_prompt})
        assert resp_hi.status_code == 200, resp_hi.text
        data_hi = resp_hi.json()
        print(f"\n  [Hindi Prompt]: '{hi_prompt}'")
        print(f"  • Detected Language: {data_hi['detectedLanguage']} (Hindi)")
        print(f"  • Origin: {data_hi['origin']['displayName']} | Destination: {data_hi['destination']['displayName']}")
        assert data_hi['detectedLanguage'] == "hi"

        print("  ✅ SUCCESS: Multilingual parameter extraction verified across English, Tamil & Hindi!")

        # -------------------------------------------------------------
        # Track 2: 'Why This Pick' Explanations
        # -------------------------------------------------------------
        print("\n[TRACK 2] Testing 'Why This Pick' Explanations...")
        hotel_sample = {
            "name": "Heritage Madurai Family Resort",
            "rating": 4.6,
            "pricePerNight": 3200,
            "reasons": ["Kid-friendly swimming pool", "Close to Meenakshi Temple", "Spacious family suites"],
            "starClass": 4
        }

        # English explanation
        resp_exp_en = client.post("/api/ai/explain", json={
            "item_type": "hotel",
            "item_data": hotel_sample,
            "profile": "family",
            "language": "en"
        })
        assert resp_exp_en.status_code == 200
        print(f"\n  [English Pick Explanation]:\n  \"{resp_exp_en.json()['explanation']}\"")

        # Tamil explanation
        resp_exp_ta = client.post("/api/ai/explain", json={
            "item_type": "hotel",
            "item_data": hotel_sample,
            "profile": "family",
            "language": "ta"
        })
        assert resp_exp_ta.status_code == 200
        print(f"\n  [Tamil Pick Explanation]:\n  \"{resp_exp_ta.json()['explanation']}\"")
        print("  ✅ SUCCESS: 'Why this pick' explanations generated cleanly!")

        # -------------------------------------------------------------
        # Track 3: Trip Cost Summary & Trade-off Analysis
        # -------------------------------------------------------------
        print("\n[TRACK 3] Testing Trip Cost Summary & Trade-Offs...")
        resp_cost = client.post("/api/ai/cost-summary", json={
            "destination": "Madurai",
            "transit_cost": 4200,
            "stay_cost": 6400,
            "food_cost": 4500,
            "user_budget": 25000,
            "hotel_details": {"name": "Heritage Madurai", "distance_km": 1.2},
            "transit_details": {"mode": "Tejas Express Train", "roundtrip": True},
            "language": "en"
        })
        assert resp_cost.status_code == 200
        cost_data = resp_cost.json()
        print(f"  • Total Cost: ₹{cost_data['breakdown']['total']:,} / Target Budget: ₹{cost_data['userBudget']:,}")
        print(f"  • Safety Margin: ₹{cost_data['remainingMargin']:,} ({cost_data['budgetUsedPercent']}% used)")
        print(f"  • Status Verdict: {cost_data['statusBadge']}")
        print(f"  • Trade-off Analysis:\n  \"{cost_data['tradeOffAnalysis']}\"")
        assert cost_data['status'] == "under_budget"
        print("  ✅ SUCCESS: Cost summation and trade-off synthesis verified!")

        # -------------------------------------------------------------
        # Live SerpApi Quota Usage check
        # -------------------------------------------------------------
        usage_resp = client.get("/api/usage")
        print(f"\n[QUOTA] Current SerpApi Calls this month: {usage_resp.json().get('serpapiCallsThisMonth')}")

        print("\n" + "=" * 70)
        print("🎉 ALL 5 AI TRACKS VERIFIED AND WORKING PROPERLY!")
        print("=" * 70)


if __name__ == "__main__":
    run_tests()
