from datetime import date as Date
from typing import Annotated, Literal

from fastapi import APIRouter, Query, Request

from .hotels import parse_child_ages
from .schemas import FlightSearchResponse, HotelSearchResponse, TransitSearchResponse

router = APIRouter(prefix="/api")

IATA = r"^[A-Za-z]{3}$"


@router.get("/flights/search", response_model=FlightSearchResponse, response_model_by_alias=True)
async def search_flights(
    request: Request,
    origin: Annotated[str, Query(pattern=IATA, description="3-letter IATA code, e.g. MAA")],
    destination: Annotated[str, Query(pattern=IATA, description="3-letter IATA code, e.g. BLR")],
    travel_date: Annotated[Date, Query(alias="date", description="YYYY-MM-DD")],
    return_date: Annotated[Date | None, Query(alias="returnDate")] = None,
    adults: Annotated[int, Query(ge=1, le=9)] = 1,
    currency: Annotated[str, Query(pattern=IATA)] = "INR",
):
    if travel_date < Date.today():
        raise ValueError("date must not be in the past")
    return await request.app.state.flights.search(
        origin, destination, travel_date, return_date, adults, currency)


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
    currency: Annotated[str, Query(pattern=IATA)] = "INR",
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


@router.get("/usage")
async def usage(request: Request):
    """Handy while testing: how many real SerpApi calls this month."""
    return {"serpapiCallsThisMonth": await request.app.state.quota.used()}
