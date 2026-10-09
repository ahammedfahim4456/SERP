"""
Live Verification Test: Frontend & Backend Integration
Tests brand-new distinct test cases directly through:
1. Direct FastAPI backend (http://127.0.0.1:8000)
2. Vite Frontend Reverse Proxy (http://localhost:3000/api)

New Test Cases:
- Case 1: Mumbai to Goa (4 friends squad, 4 days, ₹30k budget)
- Case 2: Tamil (கோயம்புத்தூரிலிருந்து ஊட்டிக்கு 2 பேர், 2 நாட்கள், ₹12k)
- Case 3: Hindi (दिल्ली से वाराणसी, 2 वयस्क, 1 बच्चा, 5 दिन, ₹35k)
- Case 4: Smart Normalization on new city pairs (Kochi / COK / Cochin, Hyderabad / HYD)
- Case 5: End-to-End Orchestrated AI Plan (Track 1) via Frontend Proxy
"""
import sys
import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_PROXY_URL = "http://localhost:3000"


def run_live_tests():
    print("=" * 75)
    print("🌍 RUNNING LIVE FRONTEND & BACKEND INTEGRATION TEST (NEW CASES)")
    print("=" * 75)

    with httpx.Client(timeout=60.0) as client:
        # 0. Health checks
        print("\n[0. SERVER HEALTH CHECKS]")
        res_backend = client.get(f"{BACKEND_URL}/api/usage")
        print(f"  • Backend (8000) Status: {res_backend.status_code} | API Usage: {res_backend.json()}")
        assert res_backend.status_code == 200

        res_frontend = client.get(f"{FRONTEND_PROXY_URL}/")
        print(f"  • Frontend (3000) HTML status: {res_frontend.status_code} (Vite running)")
        assert res_frontend.status_code == 200

        res_proxy_api = client.get(f"{FRONTEND_PROXY_URL}/api/usage")
        print(f"  • Frontend -> Backend Proxy (/api/usage): {res_proxy_api.status_code} | OK")
        assert res_proxy_api.status_code == 200

        # -------------------------------------------------------------
        # TEST CASE 1: Mumbai to Goa Squad Trip (4 Friends, 4 Days, ₹30k)
        # -------------------------------------------------------------
        print("\n[CASE 1: MUMBAI → GOA SQUAD TRIP (NEW LIVE CASE)]")
        prompt_1 = "4 college friends, Mumbai to Goa, 4 days, ₹30,000 budget, looking for beach hostels and nightlife"
        print(f"  • Prompt: '{prompt_1}'")
        res_p1 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/parse-prompt", json={"prompt": prompt_1})
        assert res_p1.status_code == 200, res_p1.text
        data_p1 = res_p1.json()

        print(f"  • Origin: {data_p1['origin']['displayName']} (IATA: {data_p1['origin']['iata']})")
        print(f"  • Destination: {data_p1['destination']['displayName']} (IATA: {data_p1['destination']['iata']})")
        print(f"  • Party: {data_p1['party']['adults']} Travelers | Duration: {data_p1['dates']['durationDays']} Days")
        print(f"  • Budget: ₹{data_p1['budget']:,}")
        assert data_p1['party']['adults'] == 4
        assert data_p1['budget'] == 30000
        assert data_p1['dates']['durationDays'] == 4

        # Explain pick for a hostel/homestay in Goa for 4 friends
        goa_stay = {
            "name": "Zostel Goa Anjuna Beach Hostel",
            "rating": 4.7,
            "pricePerNight": 1800,
            "reasons": ["Steps from Anjuna beach flea market", "Lively social backpacker common room", "Dorm & private bunk options"],
        }
        res_exp1 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/explain", json={
            "item_type": "hotel",
            "item_data": goa_stay,
            "profile": "budget",
            "language": "en"
        })
        assert res_exp1.status_code == 200
        print(f"  • AI 'Why this pick' Explanation:\n    \"{res_exp1.json()['explanation']}\"")

        # Cost summary calculation for 4 friends in Goa
        res_cost1 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/cost-summary", json={
            "destination": "Goa",
            "transit_cost": 8400,   # 4 sleeper train round-trip tickets @ ₹2,100
            "stay_cost": 5400,      # 3 nights @ ₹1,800
            "food_cost": 7200,      # 4 days @ ₹600/day/head
            "user_budget": 30000,
            "hotel_details": {"name": "Zostel Goa Anjuna", "distance_km": 0.5},
            "transit_details": {"mode": "Konkan Kanya Express Sleeper", "roundtrip": True},
            "language": "en"
        })
        assert res_cost1.status_code == 200
        cost1 = res_cost1.json()
        print(f"  • Total Cost: ₹{cost1['breakdown']['total']:,} | Budget: ₹{cost1['userBudget']:,}")
        print(f"  • Safety Margin: ₹{cost1['remainingMargin']:,} ({cost1['budgetUsedPercent']}% used) -> {cost1['statusBadge']}")
        print(f"  • Trade-off Analysis:\n    \"{cost1['tradeOffAnalysis']}\"")
        assert cost1['status'] == "under_budget"
        print("  ✅ Case 1 Passed!")

        # -------------------------------------------------------------
        # TEST CASE 2: Tamil Hill Station Trip (Coimbatore → Ooty, 2 Days, ₹12k)
        # -------------------------------------------------------------
        print("\n[CASE 2: TAMIL HILL STATION (கோயம்புத்தூர் → ஊட்டி) (NEW LIVE CASE)]")
        prompt_2 = "கோயம்புத்தூரிலிருந்து ஊட்டிக்கு 2 பேர், 2 நாட்கள், 12000 ரூபாய் பட்ஜெட்"
        print(f"  • Tamil Prompt: '{prompt_2}'")
        res_p2 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/parse-prompt", json={"prompt": prompt_2})
        assert res_p2.status_code == 200, res_p2.text
        data_p2 = res_p2.json()

        print(f"  • Detected Language: {data_p2['detectedLanguage']} (Tamil)")
        print(f"  • Origin: {data_p2['origin']['displayName']} | Destination: {data_p2['destination']['displayName']}")
        print(f"  • Party: {data_p2['party']['adults']} Adults | Budget: ₹{data_p2['budget']:,}")
        assert data_p2['detectedLanguage'] == "ta"

        # Explain pick in Tamil
        ooty_stay = {
            "name": "Ooty Lakeview Heritage Cottage",
            "rating": 4.5,
            "pricePerNight": 2800,
            "reasons": ["அழகான ஏரி காட்சி", "சூடான நெருப்பிடம்", "குடும்பத்திற்கு அமைதியான சூழல்"],
        }
        res_exp2 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/explain", json={
            "item_type": "hotel",
            "item_data": ooty_stay,
            "profile": "family",
            "language": "ta"
        })
        assert res_exp2.status_code == 200
        print(f"  • Tamil Pick Explanation:\n    \"{res_exp2.json()['explanation']}\"")

        # Tamil cost summary
        res_cost2 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/cost-summary", json={
            "destination": "Ooty",
            "transit_cost": 1600,
            "stay_cost": 2800,
            "food_cost": 2000,
            "user_budget": 12000,
            "hotel_details": {"name": "Ooty Lakeview Cottage"},
            "transit_details": {"mode": "Nilgiri Mountain Toy Train"},
            "language": "ta"
        })
        assert res_cost2.status_code == 200
        cost2 = res_cost2.json()
        print(f"  • Tamil Cost Verdict: {cost2['statusBadge']} (மீதம்: ₹{cost2['remainingMargin']:,})")
        print(f"  • Tamil Trade-off:\n    \"{cost2['tradeOffAnalysis']}\"")
        print("  ✅ Case 2 Passed!")

        # -------------------------------------------------------------
        # TEST CASE 3: Hindi Cultural Pilgrimage (Delhi → Varanasi, 5 Days, ₹35k)
        # -------------------------------------------------------------
        print("\n[CASE 3: HINDI CULTURAL HERITAGE (दिल्ली → वाराणसी) (NEW LIVE CASE)]")
        prompt_3 = "2 वयस्क, 1 बच्चा, दिल्ली से वाराणसी, 5 दिन, ₹35000 बजट"
        print(f"  • Hindi Prompt: '{prompt_3}'")
        res_p3 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/parse-prompt", json={"prompt": prompt_3})
        assert res_p3.status_code == 200, res_p3.text
        data_p3 = res_p3.json()

        print(f"  • Detected Language: {data_p3['detectedLanguage']} (Hindi)")
        print(f"  • Origin: {data_p3['origin']['displayName']} | Destination: {data_p3['destination']['displayName']}")
        print(f"  • Adults: {data_p3['party']['adults']} | Kids: {data_p3['party']['children']} | Budget: ₹{data_p3['budget']:,}")
        assert data_p3['detectedLanguage'] == "hi"
        assert data_p3['party']['adults'] == 2
        assert data_p3['party']['children'] == 1

        # Hindi cost summary
        res_cost3 = client.post(f"{FRONTEND_PROXY_URL}/api/ai/cost-summary", json={
            "destination": "Varanasi",
            "transit_cost": 7500,   # Vande Bharat Express roundtrip for family
            "stay_cost": 12000,     # 4 nights @ ₹3,000 near Ghats
            "food_cost": 6500,
            "user_budget": 35000,
            "hotel_details": {"name": "Ganga Heritage View Haveli", "distance_km": 0.3},
            "transit_details": {"mode": "Vande Bharat Express (NDLS -> BSB)"},
            "language": "hi"
        })
        assert res_cost3.status_code == 200
        cost3 = res_cost3.json()
        print(f"  • Hindi Status: {cost3['statusBadge']} (शेष राशि: ₹{cost3['remainingMargin']:,})")
        print(f"  • Hindi Trade-off Analysis:\n    \"{cost3['tradeOffAnalysis']}\"")
        print("  ✅ Case 3 Passed!")

        # -------------------------------------------------------------
        # TEST CASE 4: Smart Search Normalization (New Cities)
        # -------------------------------------------------------------
        print("\n[CASE 4: SMART NORMALIZATION ON NEW HUBS]")
        new_aliases = [
            ("Kochi", "COK"),
            ("Cochin", "COK"),
            ("Ernakulam", "COK"),
            ("Hyderabad", "HYD"),
            ("Secunderabad", "HYD"),
            ("Calcutta", "CCU"),
            ("Kolkata", "CCU"),
            ("Varanasi", "VNS"),
            ("Kashi", "VNS"),
        ]
        for name, expected_iata in new_aliases:
            norm_res = client.get(f"{FRONTEND_PROXY_URL}/api/ai/normalize?location={name}")
            assert norm_res.status_code == 200
            ndata = norm_res.json()
            print(f"  • '{name}' -> Canonical: '{ndata['canonicalId']}' | IATA: '{ndata['iataCode']}' | Display: '{ndata['displayName']}'")
            if expected_iata:
                assert ndata['iataCode'] == expected_iata

        print("  ✅ Case 4 Passed: All new city aliases correctly consolidated!")

        # -------------------------------------------------------------
        # TEST CASE 5: End-to-End Orchestrated AI Plan Flow (Track 1)
        # -------------------------------------------------------------
        print("\n[CASE 5: END-TO-END ORCHESTRATION PIPELINE (/api/ai/plan)]")
        res_plan = client.post(f"{FRONTEND_PROXY_URL}/api/ai/plan", json={
            "prompt": "2 adults, Bengaluru to Gokarna, 3 days, ₹15000 budget"
        })
        print(f"  • Status Code: {res_plan.status_code}")
        assert res_plan.status_code == 200, res_plan.text
        plan_data = res_plan.json()
        print(f"  • Origin -> Destination: {plan_data['parameters']['origin']['displayName']} → {plan_data['parameters']['destination']['displayName']}")
        print(f"  • Financial Summary: Total ₹{plan_data['financialSummary']['breakdown']['total']:,} vs Budget ₹{plan_data['financialSummary']['userBudget']:,} ({plan_data['financialSummary']['statusBadge']})")
        print(f"  • Recommended Transit: {plan_data['recommendedPicks']['transit']['mode']}")
        print(f"  • Transit Reason: \"{plan_data['recommendedPicks']['transit']['explanation'][:120]}...\"")
        print(f"  • Stay Reason: \"{plan_data['recommendedPicks']['hotel']['explanation'][:120]}...\"")
        print("  ✅ Case 5 Passed: Full end-to-end plan orchestration verified!")

        print("\n" + "=" * 75)
        print("🎉 ALL NEW LIVE TEST CASES PASSED WITH 100% SUCCESS!")
        print("=" * 75)


if __name__ == "__main__":
    run_live_tests()
