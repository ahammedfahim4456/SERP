from datetime import date as Date
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field

from .hotels import parse_child_ages
from .normalizer import normalize_location, get_known_cities
from .schemas import (
    FlightSearchResponse,
    AirbnbSearchResponse,
    FoodSearchResponse,
    HotelSearchResponse,
    TransitSearchResponse,
    TripadvisorSearchResponse,
)

router = APIRouter(prefix="/api")

CURRENCY_CODE = r"^[A-Za-z]{3}$"


@router.get("/cities")
async def list_cities(q: str | None = None):
    """Search global IATA airport cities and countries with capital-airport resolution."""
    return {"cities": get_known_cities(q)}


@router.get("/airbnb/search", response_model=AirbnbSearchResponse, response_model_by_alias=True)
async def search_airbnb(
    request: Request,
    destination: Annotated[str, Query(min_length=2, max_length=120)],
    check_in: Annotated[Date, Query(alias="checkIn")],
    check_out: Annotated[Date, Query(alias="checkOut")],
    adults: Annotated[int, Query(ge=1, le=16)] = 1,
    children: Annotated[int, Query(ge=0, le=16)] = 0,
    currency: Annotated[str, Query(pattern=IATA)] = "INR",
):
    return await request.app.state.airbnb.search(
        destination, check_in, check_out, adults, children, currency)


@router.get("/flights/search", response_model=FlightSearchResponse, response_model_by_alias=True)
async def search_flights(
    request: Request,
    origin: Annotated[str, Query(min_length=2, max_length=120, description="City, country, airport name, or IATA code")],
    destination: Annotated[str, Query(min_length=2, max_length=120, description="City, country, airport name, or IATA code")],
    travel_date: Annotated[Date, Query(alias="date", description="YYYY-MM-DD")],
    return_date: Annotated[Date | None, Query(alias="returnDate")] = None,
    adults: Annotated[int, Query(ge=1, le=9)] = 1,
    children: Annotated[int, Query(ge=0, le=6)] = 0,
    currency: Annotated[str, Query(pattern=CURRENCY_CODE)] = "INR",
):
    if travel_date < Date.today():
        raise ValueError("date must not be in the past")
    origin_location = normalize_location(origin)
    destination_location = normalize_location(destination)
    if not origin_location.iata_code:
        raise ValueError(f"No IATA airport code found for departure location: {origin}")
    if not destination_location.iata_code:
        raise ValueError(f"No IATA airport code found for destination: {destination}")
    return await request.app.state.flights.search(
        origin_location.iata_code, destination_location.iata_code,
        travel_date, return_date, adults, currency, children=children)


@router.get("/transit/search", response_model=TransitSearchResponse, response_model_by_alias=True)
async def search_transit(
    request: Request,
    origin: Annotated[str, Query(min_length=2, max_length=120,
                                 description="Free text, e.g. 'Chennai Central, Chennai'")],
    destination: Annotated[str, Query(min_length=2, max_length=120,
                                      description="Free text, e.g. 'Bengaluru City Junction, Bengaluru'")],
):
    return await request.app.state.transit.search(origin, destination)


@router.get("/hotels/search", response_model=HotelSearchResponse, response_model_by_alias=True)
async def search_hotels(
    request: Request,
    destination: Annotated[str, Query(min_length=2, max_length=120, description="City or area, e.g. 'Bengaluru'")],
    check_in: Annotated[Date, Query(alias="checkIn", description="YYYY-MM-DD")],
    check_out: Annotated[Date, Query(alias="checkOut", description="YYYY-MM-DD")],
    adults: Annotated[int, Query(ge=1, le=9)] = 2,
    children: Annotated[int, Query(ge=0, le=6)] = 0,
    child_ages: Annotated[str | None, Query(alias="childAges", description="One age per child, e.g. 5,8")] = None,
    currency: Annotated[str, Query(pattern=CURRENCY_CODE)] = "INR",
    profile: Annotated[Literal["family", "business", "budget"] | None, Query(
        description="Ranking style. Default: family if children > 0, otherwise budget")] = None,
    include_rentals: Annotated[bool | None, Query(alias="includeRentals")] = None,
    include_hostels: Annotated[bool, Query(alias="includeHostels")] = False,
    limit: Annotated[int, Query(ge=1, le=20)] = 10,
):
    ages = parse_child_ages(child_ages, children)
    return await request.app.state.hotels.search(
        destination, check_in, check_out, adults, ages, currency, profile,
        include_rentals, include_hostels, limit)


@router.get("/food/search", response_model=FoodSearchResponse, response_model_by_alias=True)
async def search_food(
    request: Request,
    lat: Annotated[float, Query(ge=-90, le=90, description="Anchor latitude, e.g. the chosen hotel")],
    lng: Annotated[float, Query(ge=-180, le=180, description="Anchor longitude")],
    category: Annotated[Literal["any", "vegetarian", "family", "breakfast", "cafe", "fine_dining"], Query()] = "any",
    cuisine: Annotated[str | None, Query(description="Optional, e.g. chettinad or north indian")] = None,
    vegetarian_only: Annotated[bool, Query(alias="vegetarianOnly",
                                           description="Only places listed as vegetarian; also searches for them")] = False,
    meal: Annotated[Literal["breakfast", "lunch", "dinner"] | None, Query()] = None,
    max_distance_km: Annotated[float, Query(alias="maxDistanceKm", ge=0.2, le=20)] = 3.0,
    min_rating: Annotated[float | None, Query(alias="minRating", ge=0, le=5)] = None,
    adults: Annotated[int, Query(ge=1, le=9)] = 2,
    children: Annotated[int, Query(ge=0, le=6)] = 0,
    profile: Annotated[Literal["family", "business", "budget"] | None, Query(
        description="Ranking style. Default: family if children > 0, otherwise budget")] = None,
    limit: Annotated[int, Query(ge=1, le=20)] = 10,
):
    return await request.app.state.food.search(
        lat, lng, category, cuisine, vegetarian_only, meal, max_distance_km, min_rating,
        adults, children, profile, limit)


@router.get("/recommendations/tripadvisor", response_model=TripadvisorSearchResponse, response_model_by_alias=True)
async def get_tripadvisor_recommendations(
    request: Request,
    destination: Annotated[str, Query(min_length=2, max_length=120, description="City or area, e.g. 'Gokarna'")],
    budget: Annotated[int | None, Query(ge=1000, description="Optional target budget")] = None,
):
    return await request.app.state.tripadvisor.recommend(destination, budget)


@router.get("/usage")
async def usage(request: Request):
    """Handy while testing: how many real SerpApi calls this month."""
    return {"serpapiCallsThisMonth": await request.app.state.quota.used()}


# ==============================================================================
# AI Endpoints (Tracks 1, 2, 3, 4, 5)
# ==============================================================================
class PromptRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="Natural language trip request, e.g. '2 adults, 2 kids, Chennai to Madurai, 3 days, ₹25k budget'",
    )


class ExplainPickRequest(BaseModel):
    item_type: Literal["hotel", "flight", "transit"] = "hotel"
    item_data: dict[str, Any]
    profile: Literal["family", "budget", "business"] = "family"
    language: Literal["en", "ta", "hi"] = "en"


class CostSummaryRequest(BaseModel):
    destination: str
    transit_cost: int
    stay_cost: int
    food_cost: int
    user_budget: int
    hotel_details: dict[str, Any] | None = None
    food_details: dict[str, Any] | None = None
    transit_details: dict[str, Any] | None = None
    language: Literal["en", "ta", "hi"] = "en"


@router.post("/ai/parse-prompt")
async def parse_prompt(request: Request, body: PromptRequest):
    """Track 1, 4, 5: Extracts structured travel parameters from natural text in English, Tamil, or Hindi."""
    return await request.app.state.ai.parse_trip_prompt(body.prompt)


@router.post("/ai/plan")
async def plan_trip_ai(request: Request, body: PromptRequest):
    """
    Track 1-5 End-to-End Orchestrator:
    Parses prompt -> queries SerpApi services -> selects top picks -> generates explanations & cost summary.
    """
    return await request.app.state.ai.plan_trip_flow(body.prompt, request.app.state)


@router.post("/ai/explain")
async def explain_pick(request: Request, body: ExplainPickRequest):
    """Track 2 & 4: Generates friendly 'Why this pick' explanation in English, Tamil, or Hindi."""
    explanation = await request.app.state.ai.explain_pick(
        item_type=body.item_type,
        item_data=body.item_data,
        profile=body.profile,
        language=body.language,
    )
    return {
        "itemType": body.item_type,
        "language": body.language,
        "profile": body.profile,
        "explanation": explanation,
    }


@router.post("/ai/cost-summary")
async def cost_summary(request: Request, body: CostSummaryRequest):
    """Track 3 & 4: Combines total trip damage and analyzes practical trade-offs."""
    return await request.app.state.ai.generate_cost_summary(
        destination_name=body.destination,
        transit_cost=body.transit_cost,
        stay_cost=body.stay_cost,
        food_cost=body.food_cost,
        user_budget=body.user_budget,
        hotel_details=body.hotel_details,
        food_details=body.food_details,
        transit_details=body.transit_details,
        language=body.language,
    )


@router.get("/ai/normalize")
async def normalize_city_endpoint(
    location: Annotated[
        str,
        Query(
            min_length=1,
            max_length=100,
            description="City name or airport code, e.g. 'BLR' or 'Bangalore' or 'Madras'",
        ),
    ]
):
    """Track 5: Normalizes any spelling or airport code to canonical cache key & display info."""
    norm = normalize_location(location)
    return {
        "raw": location,
        "canonicalId": norm.canonical_id,
        "displayName": norm.display_name,
        "iataCode": norm.iata_code,
        "transitQuery": norm.transit_query,
        "state": norm.state,
        "countryCode": norm.country_code,
    }
