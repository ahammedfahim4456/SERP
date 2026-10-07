import json
import logging
import re
from datetime import date, timedelta
from typing import Any, Literal

import httpx

from .normalizer import NormalizedLocation, normalize_location

log = logging.getLogger("ai")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

LanguageType = Literal["en", "ta", "hi"]


def detect_language(text: str) -> LanguageType:
    """Detects whether text contains Tamil, Hindi (Devanagari), or English."""
    # Tamil Unicode block: \u0B80-\u0BFF
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    # Devanagari Unicode block (Hindi): \u0900-\u097F
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    return "en"


class AiService:
    def __init__(self, api_key: str | None = None, model: str = "gemini-3.8-flash") -> None:
        self.api_key = api_key.strip() if api_key and api_key.strip() else None
        self.model = model or "gemini-3.8-flash"

    # --------------------------------------------------------------------------
    # Core LLM Caller with Fallback
    # --------------------------------------------------------------------------
    async def _call_gemini(self, prompt: str, system_instruction: str | None = None) -> tuple[str | None, str | None]:
        """Calls Google Gemini API. Tries active supported models and returns (text_output, model_name)."""
        if not self.api_key:
            log.info("GEMINI_API_KEY is not set: using smart offline AI rules")
            return None, None

        # Build prioritized list of models to try
        candidates = [self.model, "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash"]
        seen = set()
        models_to_try = []
        for m in candidates:
            if m and m not in seen:
                seen.add(m)
                models_to_try.append(m)

        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"SYSTEM INSTRUCTION: {system_instruction}\n\nTask:\n{prompt}"}]
            })
        else:
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })

        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048,
            }
        }

        for model_name in models_to_try:
            url = GEMINI_API_URL.format(model=model_name)
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    res = await client.post(url, params={"key": self.api_key}, json=body)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates") or []
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text_out = parts[0].get("text", "").strip()
                                log.info("Live Gemini API call succeeded with model %s", model_name)
                                return text_out, model_name
                    elif res.status_code in (404, 429):
                        log.warning("Gemini model %s returned status %s (%s), trying fallback model...", model_name, res.status_code, res.text[:120])
                        continue
                    else:
                        log.warning("Gemini API returned status %s: %s", res.status_code, res.text[:200])
            except Exception as e:
                log.warning("Gemini API call with %s failed (%s), trying next model...", model_name, e)

        return None, None

    # --------------------------------------------------------------------------
    # Track 1 & 5: Parse Natural Language Trip Prompt & Normalize
    # --------------------------------------------------------------------------
    async def parse_trip_prompt(self, prompt: str) -> dict[str, Any]:
        """
        Parses prompts like:
        "2 adults, 2 kids, Chennai to Madurai, 3 days, ₹25k budget"
        or in Tamil: "2 பெரியவர்கள், 2 குழந்தைகள், சென்னையிலிருந்து மதுரை, 3 நாட்கள், 25000 ரூபாய் பட்ஜெட்"
        Returns structured normalized parameters.
        """
        detected_lang = detect_language(prompt)

        # 1. Try Gemini LLM if key is configured
        system_inst = (
            "You are a travel parameter parser for India. "
            "Extract travel details into JSON with keys: "
            "origin (city string), destination (city string), adults (int), "
            "children (int), durationDays (int), budget (int in INR), "
            "profile ('family' if children>0 else 'budget' or 'business'), "
            "travelDate (YYYY-MM-DD or null). "
            "Output strictly valid JSON with no markdown formatting."
        )
        llm_response, model_used = await self._call_gemini(f"Extract travel parameters from: '{prompt}'", system_inst)

        parsed_data: dict[str, Any] = {}
        if llm_response:
            try:
                cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", llm_response.strip(), flags=re.DOTALL)
                parsed_data = json.loads(cleaned)
            except Exception as e:
                log.warning("Failed to parse Gemini JSON output: %s", e)

        # 2. Smart Rule-Based Fallback / Enrichment
        if not parsed_data.get("origin") or not parsed_data.get("destination"):
            rule_data = self._rule_parse_prompt(prompt)
            for k, v in rule_data.items():
                if k not in parsed_data or parsed_data[k] is None:
                    parsed_data[k] = v

        # Normalize locations (Track 5: Smart Normalization)
        origin_raw = parsed_data.get("origin") or "Chennai"
        dest_raw = parsed_data.get("destination") or "Madurai"

        norm_origin = normalize_location(origin_raw)
        norm_dest = normalize_location(dest_raw)

        # Dates calculation
        days = int(parsed_data.get("durationDays") or 3)
        nights = max(1, days - 1)
        start_date = parsed_data.get("travelDate")
        if not start_date:
            # Default to next upcoming weekend (e.g., 7 days ahead)
            t_date = date.today() + timedelta(days=7)
            start_date = t_date.isoformat()
            end_date = (t_date + timedelta(days=nights)).isoformat()
        else:
            try:
                dt = date.fromisoformat(start_date)
                end_date = (dt + timedelta(days=nights)).isoformat()
            except Exception:
                t_date = date.today() + timedelta(days=7)
                start_date = t_date.isoformat()
                end_date = (t_date + timedelta(days=nights)).isoformat()

        adults = int(parsed_data.get("adults") or 2)
        children = int(parsed_data.get("children") or 0)
        child_ages = [7, 10][:children] if children > 0 else []

        budget = int(parsed_data.get("budget") or 25000)
        profile = parsed_data.get("profile") or ("family" if children > 0 else "budget")

        raw_dest_list = parsed_data.get("destinations") or [dest_raw]
        norm_dest_list = [normalize_location(d).display_name for d in raw_dest_list if d]
        if not norm_dest_list:
            norm_dest_list = [norm_dest.display_name]

        return {
            "originalPrompt": prompt,
            "detectedLanguage": detected_lang,
            "isLiveAi": bool(model_used),
            "aiModel": model_used or "smart-engine",
            "aiProvider": f"Google Gemini API ({model_used})" if model_used else "Rule-Engine Fallback",
            "origin": {
                "raw": origin_raw,
                "canonicalId": norm_origin.canonical_id,
                "displayName": norm_origin.display_name,
                "iata": norm_origin.iata_code or "MAA",
                "transitQuery": norm_origin.transit_query,
                "state": norm_origin.state,
            },
            "destination": {
                "raw": dest_raw,
                "canonicalId": norm_dest.canonical_id,
                "displayName": norm_dest.display_name,
                "iata": norm_dest.iata_code or "IXM",
                "transitQuery": norm_dest.transit_query,
                "state": norm_dest.state,
            },
            "destinations": norm_dest_list,
            "dates": {
                "startDate": start_date,
                "endDate": end_date,
                "durationDays": days,
                "nights": nights,
            },
            "party": {
                "adults": adults,
                "children": children,
                "childAges": child_ages,
                "profile": profile,
            },
            "budget": budget,
            "currency": "INR",
        }

    def _rule_parse_prompt(self, text: str) -> dict[str, Any]:
        """Robust regex parsing across English, Tamil, and Hindi travel queries."""
        t_clean = text.lower().replace(",", "")
        t = text.lower()

        # Adults / Travelers (including '4 college friends', 'people', 'travelers', 'பேர்', 'लोग')
        adults_m = re.search(r"(\d+)\s*(?:\w+\s+)?(?:adult|adults|friends|friend|people|persons|travelers|passengers|guys|members?|பெரியவர்கள்|பேர்|வயஸ்க|लोग|elder)", t_clean)
        adults = int(adults_m.group(1)) if adults_m else 2

        # Kids
        kids_m = re.search(r"(\d+)\s*(?:kid|kids|child|children|baby|babies|infant|infants|குழந்தைகள்|குழந்தை|बच्चे|बच्चा)", t_clean)
        children = int(kids_m.group(1)) if kids_m else 0

        # Days / Duration
        days_m = re.search(r"(\d+)\s*(?:day|days|நாட்கள்|நாள்|दिन)", t_clean)
        days = int(days_m.group(1)) if days_m else 3

        # Budget (₹25k, 25000, 30,000, 25k, 25000 ரூபாய், 25000 रुपये)
        budget = 25000
        patterns = [
            r"[₹₹]\s*(\d+(?:\.\d+)?)\s*(k|lakh|thousand)?",
            r"(?:rs\.?|inr|ரூபாய்|रुपये)\s*(\d+(?:\.\d+)?)\s*(k|lakh|thousand)?",
            r"(\d+(?:\.\d+)?)\s*(k|lakh|thousand)\s*(?:budget|பட்ஜெட்|बजट)?",
            r"(?:budget|பட்ஜெட்|बजट)\s*[:=]?\s*[₹₹]?\s*(\d+(?:\.\d+)?)\s*(k|lakh|thousand)?",
            r"(\d{4,6})\s*(?:budget|பட்ஜெட்|बजट)?",
        ]
        for pat in patterns:
            bm = re.search(pat, t_clean)
            if bm:
                val = float(bm.group(1))
                mult = (bm.group(2) if len(bm.groups()) > 1 and bm.group(2) else "").lower()
                if mult == "k" or "k" in bm.group(0):
                    budget = int(val * 1000)
                elif mult == "lakh":
                    budget = int(val * 100000)
                elif mult == "thousand":
                    budget = int(val * 1000)
                elif val >= 1000:
                    budget = int(val)
                break

        # Extract Origin & Destination
        # Pattern 1: "from X to Y" or "X to Y" or "X இருந்து Y" or "X se Y"
        from .normalizer import LOCATION_ALIASES
        origin = "Chennai"
        destinations = ["Madurai"]
        to_m = re.search(r"(?:from\s+)?([a-zA-Z\u0B80-\u0BFF\u0900-\u097F]+)\s+(?:to|->|வரை|செல்ல|சேர|से)\s+([a-zA-Z\u0B80-\u0BFF\u0900-\u097F]+)", text, re.IGNORECASE)
        if to_m:
            origin = to_m.group(1).strip()
            dest_first = to_m.group(2).strip()
            destinations = [dest_first]
            # Check if there is an 'and' or 'vs' or second destination
            rest_m = re.findall(r"(?:and|vs|மற்றும்|और)\s+([a-zA-Z\u0B80-\u0BFF\u0900-\u097F]+)", text, re.IGNORECASE)
            for extra in rest_m:
                if extra.strip().lower() not in [origin.lower(), dest_first.lower()]:
                    destinations.append(extra.strip())
        else:
            found_cities = []
            for city_key, loc in LOCATION_ALIASES.items():
                if len(city_key) >= 3 and city_key in t:
                    if loc.display_name not in found_cities:
                        found_cities.append(loc.display_name)
            if len(found_cities) >= 2:
                origin = found_cities[0]
                destinations = found_cities[1:]
            elif len(found_cities) == 1:
                destinations = [found_cities[0]]

        return {
            "origin": origin,
            "destination": destinations[0] if destinations else "Madurai",
            "destinations": destinations,
            "adults": adults,
            "children": children,
            "durationDays": days,
            "budget": budget,
            "profile": "family" if children > 0 else "budget",
        }

    # --------------------------------------------------------------------------
    # Track 2: "Why This Pick" Explanations
    # --------------------------------------------------------------------------
    async def explain_pick(
        self,
        item_type: Literal["hotel", "flight", "transit"],
        item_data: dict[str, Any],
        profile: str = "family",
        language: LanguageType = "en",
    ) -> str:
        """Generates friendly, human-centric justification for a specific ranked option."""
        prompt = (
            f"Explain in 2-3 concise sentences why this {item_type} was picked for a {profile} trip. "
            f"Details: {json.dumps(item_data, default=str)}. "
            f"Write the response strictly in {self._lang_name(language)}."
        )

        llm_explanation, model_used = await self._call_gemini(prompt)
        if llm_explanation:
            return llm_explanation.strip()

        # Rule-based fallback explanation
        name = item_data.get("name") or item_data.get("airline") or "This option"
        price = item_data.get("pricePerNight") or item_data.get("roundTripPrice") or item_data.get("price") or 0
        rating = item_data.get("rating") or "Top Rated"

        if language == "ta":
            if item_type == "hotel":
                return f"{name} குடும்பங்களுக்கு மிகவும் பாதுகாப்பானது ({rating}★ மதிப்பீடு). ஒரு இரவுக்கு ₹{price:,} கட்டணத்தில் சிறந்த வசதிகளை வழங்குகிறது."
            elif item_type == "transit":
                return f"{name} இரவுப் பயணமாக செல்வதால் ஒரு நாள் விடுதி செலவை (Hotel cost) மிச்சப்படுத்துகிறது. கட்டணம் ₹{price:,} மட்டுமே."
            else:
                return f"{name} நேரடி விமானம் ஆகும். நேரத்தை மிச்சப்படுத்தி குடும்பத்தினருக்கு வசதியான பயணத்தை உறுதி செய்கிறது."
        elif language == "hi":
            if item_type == "hotel":
                return f"{name} परिवारों के लिए सुरक्षित और उपयुक्त है ({rating}★ रेटिंग)। ₹{price:,}/रात में यह सर्वोत्तम सुविधाएं प्रदान करता है।"
            elif item_type == "transit":
                return f"{name} रात का सफर होने के कारण एक दिन के होटल का खर्च बचाता है। किराया केवल ₹{price:,} है।"
            else:
                return f"{name} सीधी उड़ान है जो यात्रा का समय बचाती है और आरामदायक सफर सुनिश्चित करती है।"
        else:
            if item_type == "hotel":
                reasons = item_data.get("reasons") or ["Great value", "High guest satisfaction"]
                reasons_str = ", ".join(reasons[:2])
                return f"{name} is selected for its high family comfort score ({rating}★). Key highlights: {reasons_str} at ₹{price:,}/night."
            elif item_type == "transit":
                return f"{name} is the most balanced transit option at ₹{price:,}. Its schedule minimizes travel fatigue and cuts down on daytime transit hours."
            else:
                stops = item_data.get("stops", 0)
                stop_str = "non-stop" if stops == 0 else f"{stops}-stop"
                return f"{name} is the optimal {stop_str} route at ₹{price:,}, balancing departure convenience and transparent baggage allowances."

    # --------------------------------------------------------------------------
    # Track 3: Trip Cost Summary & Trade-off Analysis
    # --------------------------------------------------------------------------
    async def generate_cost_summary(
        self,
        destination_name: str,
        transit_cost: int,
        stay_cost: int,
        food_cost: int,
        user_budget: int,
        hotel_details: dict[str, Any] | None = None,
        transit_details: dict[str, Any] | None = None,
        language: LanguageType = "en",
    ) -> dict[str, Any]:
        """Combines transport, hotel, and meal costs, and explains trade-offs."""
        total_cost = transit_cost + stay_cost + food_cost
        diff = user_budget - total_cost
        pct_used = round((total_cost / max(1, user_budget)) * 100)

        if diff >= 2000:
            verdict = "under_budget"
            status_badge = "🟢 Under Budget"
        elif diff >= 0:
            verdict = "tight_fit"
            status_badge = "🟡 Tight Fit"
        else:
            verdict = "over_budget"
            status_badge = "🔴 Over Budget"

        prompt = (
            f"Write a friendly 3-4 sentence trade-off analysis for a trip to {destination_name}. "
            f"Budget: ₹{user_budget:,}, Total Cost: ₹{total_cost:,} (Transit: ₹{transit_cost:,}, Stay: ₹{stay_cost:,}, Food: ₹{food_cost:,}). "
            f"Remaining Margin: ₹{diff:,}. Status: {verdict}. "
            f"Hotel Info: {hotel_details or {}}. Transit Info: {transit_details or {}}. "
            f"Mention practical trade-offs like distance vs hotel savings or train vs flight savings. "
            f"Write strictly in {self._lang_name(language)}."
        )

        analysis, model_used = await self._call_gemini(prompt)

        if not analysis:
            if language == "ta":
                if diff >= 0:
                    analysis = (
                        f"{destination_name} பயணத்தின் மொத்த செலவு ₹{total_cost:,}. உங்கள் பட்ஜெட்டில் (₹{user_budget:,}) "
                        f"இன்னும் ₹{diff:,} மீதம் உள்ளது! மலிவான ரயில் பயணத்தை தேர்ந்தெடுத்தால் மேலும் சேமிக்கலாம்."
                    )
                else:
                    analysis = (
                        f"{destination_name} பயணம் உங்கள் பட்ஜெட்டை விட ₹{abs(diff):,} அதிகம். "
                        f"விமானத்திற்கு பதிலாக ரயிலை அல்லது மையப்பகுதிக்கு வெளியே உள்ள தங்குமிடத்தை தேர்வு செய்வதன் மூலம் ₹4,000 வரை மிச்சப்படுத்தலாம்."
                    )
            elif language == "hi":
                if diff >= 0:
                    analysis = (
                        f"{destination_name} यात्रा का कुल खर्च ₹{total_cost:,} है। आपके बजट (₹{user_budget:,}) में से "
                        f"₹{diff:,} अभी भी शेष हैं! ट्रेन विकल्प चुनकर आप और अधिक बचत कर सकते हैं।"
                    )
                else:
                    analysis = (
                        f"{destination_name} यात्रा आपके बजट से ₹{abs(diff):,} अधिक हो रही है। "
                        f"फ्लाइट की जगह स्लीपर ट्रेन या मुख्य शहर से 3 किमी दूर का होटल चुनने से ₹4,000 की बचत हो सकती है।"
                    )
            else:
                if diff >= 0:
                    analysis = (
                        f"Your {destination_name} trip totals ₹{total_cost:,}, leaving a comfortable safety buffer of ₹{diff:,} (used {pct_used}% of your ₹{user_budget:,} budget). "
                        f"Opting for an overnight train or verified homestay kept your accommodation and transit costs well balanced."
                    )
                else:
                    analysis = (
                        f"Your selected plan totals ₹{total_cost:,}, exceeding your ₹{user_budget:,} budget by ₹{abs(diff):,}. "
                        f"Trade-off: Switching from flights to an overnight AC sleeper saves ₹5,200, which immediately brings the entire trip under budget without sacrificing hotel comfort."
                    )

        return {
            "destination": destination_name,
            "userBudget": user_budget,
            "breakdown": {
                "transit": transit_cost,
                "stay": stay_cost,
                "food": food_cost,
                "total": total_cost,
            },
            "remainingMargin": diff,
            "budgetUsedPercent": pct_used,
            "status": verdict,
            "statusBadge": status_badge,
            "tradeOffAnalysis": analysis.strip(),
            "language": language,
            "isLiveAi": bool(model_used),
            "aiModel": model_used or "smart-engine",
            "aiProvider": f"Google Gemini API ({model_used})" if model_used else "Rule-Engine Fallback",
        }

    # --------------------------------------------------------------------------
    # Track 1 Orchestration: Complete Chat Trip Planner Flow
    # --------------------------------------------------------------------------
    async def plan_trip_flow(self, prompt: str, app_state: Any) -> dict[str, Any]:
        """
        End-to-end trip planner:
        1. Parses parameters from prompt (with Tamil/Hindi support).
        2. Queries SerpApi services (flights, transit, hotels, tripadvisor).
        3. Generates 'Why this pick' justifications.
        4. Synthesizes total cost and trade-offs.
        """
        parsed = await self.parse_trip_prompt(prompt)
        lang: LanguageType = parsed["detectedLanguage"]

        origin_code = parsed["origin"]["iata"]
        dest_code = parsed["destination"]["iata"]
        dest_name = parsed["destination"]["displayName"]
        orig_transit = parsed["origin"]["transitQuery"]
        dest_transit = parsed["destination"]["transitQuery"]

        start_dt = date.fromisoformat(parsed["dates"]["startDate"])
        end_dt = date.fromisoformat(parsed["dates"]["endDate"])
        adults = parsed["party"]["adults"]
        child_ages = parsed["party"]["childAges"]
        profile = parsed["party"]["profile"]
        budget = parsed["budget"]
        nights = parsed["dates"]["nights"]
        days = parsed["dates"]["durationDays"]

        # 1. Fetch Flights (if distinct airports)
        flights_resp = None
        if origin_code and dest_code and origin_code != dest_code:
            try:
                flights_resp = await app_state.flights.search(
                    origin=origin_code,
                    destination=dest_code,
                    travel_date=start_dt,
                    return_date=end_dt,
                    adults=adults,
                    currency="INR",
                )
            except Exception as e:
                log.info("Flights search skipped or errored: %s", e)

        # 2. Fetch Transit (Trains / Buses)
        transit_resp = None
        try:
            transit_resp = await app_state.transit.search(origin=orig_transit, destination=dest_transit)
        except Exception as e:
            log.info("Transit search skipped or errored: %s", e)

        # 3. Fetch Hotels
        hotels_resp = None
        try:
            hotels_resp = await app_state.hotels.search(
                destination=dest_name,
                check_in=start_dt,
                check_out=end_dt,
                adults=adults,
                child_ages=child_ages,
                currency="INR",
                profile=profile,
                include_rentals=None,
                include_hostels=profile != "family",
                limit=6,
            )
        except Exception as e:
            log.warning("Hotels search failed: %s", e)

        # 4. Fetch TripAdvisor / Things to do
        tripadvisor_resp = None
        try:
            tripadvisor_resp = await app_state.tripadvisor.recommend(destination=dest_name, budget=budget)
        except Exception as e:
            log.info("TripAdvisor recommend skipped or errored: %s", e)

        # Best picks selection
        top_hotel = hotels_resp.options[0] if (hotels_resp and hotels_resp.options) else None
        top_flight = flights_resp.options[0] if (flights_resp and flights_resp.options) else None
        top_transit = transit_resp.options[0] if (transit_resp and transit_resp.options) else None

        # Choose primary transit for calculation (prefer train/bus if budget is tight, else flight)
        transit_price = 0
        selected_transit_name = "Train / Transit"
        if top_transit and top_transit.fare:
            transit_price = int(top_transit.fare * 2 * adults)
            selected_transit_name = f"Transit ({top_transit.main_mode or 'Rail'})"
        elif top_flight and top_flight.price:
            transit_price = int(top_flight.price * adults)
            selected_transit_name = f"Flight ({top_flight.airline or 'Air'})"

        hotel_price_night = top_hotel.price_per_night if top_hotel and top_hotel.price_per_night else 2000
        stay_cost = hotel_price_night * nights
        daily_food = 500 * (adults + (len(child_ages) * 0.5))
        food_cost = int(daily_food * days)

        # Generate "Why this pick" explanations
        hotel_explanation = ""
        transit_explanation = ""
        if top_hotel:
            hotel_explanation = await self.explain_pick(
                "hotel", top_hotel.model_dump(), profile=profile, language=lang
            )
        if top_transit:
            transit_explanation = await self.explain_pick(
                "transit", top_transit.model_dump(), profile=profile, language=lang
            )
        elif top_flight:
            transit_explanation = await self.explain_pick(
                "flight", top_flight.model_dump(), profile=profile, language=lang
            )

        # Generate Cost Summary & Trade-offs
        cost_summary = await self.generate_cost_summary(
            destination_name=dest_name,
            transit_cost=transit_price,
            stay_cost=stay_cost,
            food_cost=food_cost,
            user_budget=budget,
            hotel_details=top_hotel.model_dump() if top_hotel else None,
            transit_details={"name": selected_transit_name, "price": transit_price},
            language=lang,
        )

        return {
            "parameters": parsed,
            "recommendedPicks": {
                "hotel": {
                    "data": top_hotel,
                    "explanation": hotel_explanation,
                },
                "transit": {
                    "data": top_transit or top_flight,
                    "mode": selected_transit_name,
                    "explanation": transit_explanation,
                },
            },
            "financialSummary": cost_summary,
            "searchResults": {
                "hotels": hotels_resp,
                "flights": flights_resp,
                "transit": transit_resp,
                "recommendations": tripadvisor_resp,
            },
        }

    @staticmethod
    def _lang_name(lang: LanguageType) -> str:
        if lang == "ta":
            return "Tamil (தமிழ்)"
        if lang == "hi":
            return "Hindi (हिंदी)"
        return "English"
