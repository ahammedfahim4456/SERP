from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Segment(CamelModel):
    airline: str | None = None
    flight_number: str | None = None
    from_airport: str | None = None
    departure_time: str | None = None
    to_airport: str | None = None
    arrival_time: str | None = None
    duration_minutes: int = 0


class FlightOption(CamelModel):
    category: str                 # "best" or "other"
    airline: str | None = None    # first segment's airline
    price: int | None = None
    currency: str
    total_duration_minutes: int = 0
    stops: int = 0
    segments: list[Segment] = []


class FlightSearchResponse(CamelModel):
    cached: bool
    fetched_at: datetime
    origin: str
    destination: str
    options: list[FlightOption]


class TransitLeg(CamelModel):
    mode: str                              # "train", "bus", "metro" or "other"
    title: str
    service_number: str | None = None      # e.g. train number "16551"
    operator: str | None = None
    from_name: str | None = None
    from_code: str | None = None           # station code, e.g. "MAS"
    departure_time: str | None = None
    to_name: str | None = None
    to_code: str | None = None
    arrival_time: str | None = None
    duration_minutes: int = 0
    intermediate_stops: int = 0


class TransitOption(CamelModel):
    departure_time: str | None = None      # time of day only: SerpApi gives no date here
    arrival_time: str | None = None
    duration_minutes: int = 0
    walking_minutes: int = 0
    fare: float | None = None              # often missing, especially for buses
    currency: str | None = None
    main_mode: str | None = None           # mode of the longest leg
    legs: list[TransitLeg] = []


class TransitSearchResponse(CamelModel):
    cached: bool
    fetched_at: datetime
    origin: str
    destination: str
    options: list[TransitOption]


# ------------------------------ hotels ------------------------------
from datetime import date as _date  # noqa: E402


class Coordinates(CamelModel):
    latitude: float
    longitude: float


class BookingSource(CamelModel):
    name: str
    price_per_night: int | None = None
    free_cancellation: bool | None = None
    free_cancellation_until: str | None = None


class HotelOption(CamelModel):
    id: str                                   # SerpApi property_token
    name: str
    kind: str                                 # "hotel" or "rental"
    image_url: str | None = None               # Google Hotels property photo URL, when supplied
    hostel_like: bool = False                 # name/website heuristic, can be wrong
    star_class: int | None = None
    rating: float | None = None
    review_count: int | None = None
    location_rating: float | None = None
    currency: str
    nights: int
    price_per_night: int | None = None        # null means no price for these dates/guests
    total_price: int | None = None            # whole stay
    total_price_before_taxes: int | None = None   # only present for some properties
    deal: str | None = None
    features: list[str] = []                  # normalized tags, e.g. "free_breakfast", "kid_friendly"
    amenities: list[str] = []                 # raw strings from the provider
    sleeps: int | None = None                 # rentals only
    bedrooms: int | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    airport_taxi_minutes: int | None = None
    coordinates: Coordinates | None = None
    website: str | None = None
    booking_sources: list[BookingSource] = []
    free_cancellation: bool | None = None     # known for some rentals only; null for most hotels

    # filled by the ranking step, never cached
    score: int | None = None                  # 0 to 100
    labels: list[str] = []
    reasons: list[str] = []


class HotelSearchResponse(CamelModel):
    cached: bool
    fetched_at: datetime
    destination: str
    check_in: _date
    check_out: _date
    nights: int
    adults: int
    children: int
    profile: str | None = None                # family / business / budget, null if not ranked
    google_hotels_url: str | None = None
    total_found: int = 0                      # properties on the page we fetched
    unpriced_count: int = 0                   # no price for these dates/guests
    hidden_count: int = 0                     # removed by the profile's rules
    options: list[HotelOption]


# ------------------------------ food ------------------------------
class FoodOption(CamelModel):
    id: str                                   # Google place_id
    name: str
    type: str | None = None                   # primary type, e.g. "Vegetarian restaurant"
    types: list[str] = []
    rating: float | None = None
    review_count: int | None = None
    address: str | None = None
    coordinates: Coordinates | None = None
    phone: str | None = None
    website: str | None = None
    thumbnail: str | None = None
    price_label: str | None = None            # e.g. "₹200–400" (believed to be per person, unverified)
    price_low: int | None = None
    price_high: int | None = None             # null for open-ended bands like "₹2,000+"
    estimated_per_person: int | None = None   # rough: middle of the band
    estimated_meal_cost: int | None = None    # rough: estimated_per_person x party size
    open_state: str | None = None             # snapshot at fetchedAt, can be stale when served from cache
    operating_hours: dict[str, str] = {}      # by weekday, raw text
    meals: list[str] = []                     # breakfast / lunch / dinner when the listing says so
    features: list[str] = []                  # normalized tags, e.g. "kid_friendly", "vegetarian_only"
    atmosphere: list[str] = []
    highlights: list[str] = []
    can_reserve: bool = False
    order_online: bool = False
    google_position: int | None = None        # Google's own order of the page

    # filled when ranking, never cached
    distance_km: float | None = None          # straight line from the anchor point
    walk_minutes: int | None = None           # straight-line estimate at about 5 km/h
    score: int | None = None
    labels: list[str] = []
    reasons: list[str] = []


class FoodSearchResponse(CamelModel):
    cached: bool
    fetched_at: datetime
    query: str
    anchor: Coordinates | None = None
    profile: str | None = None
    party_size: int | None = None
    total_found: int = 0
    hidden_count: int = 0
    options: list[FoodOption]


# ------------------------------ tripadvisor ------------------------------
class TripadvisorRecommendation(CamelModel):
    title: str
    category: str | None = None
    description: str | None = None
    location: str | None = None
    thumbnail_url: str | None = None
    link: str | None = None
    rating: float | None = None
    review_count: int | None = None


class TripadvisorSearchResponse(CamelModel):
    cached: bool
    fetched_at: datetime
    destination: str
    recommendations: list[TripadvisorRecommendation]


class AirbnbOption(CamelModel):
    id: str
    name: str
    property_type: str | None = None
    room_type: str | None = None
    image_url: str | None = None
    listing_url: str | None = None
    rating: float | None = None
    review_count: int | None = None
    price_per_night: int | None = None
    total_price: int | None = None
    currency: str
    bedrooms: int | None = None
    beds: int | None = None
    bathrooms: int | None = None


class AirbnbSearchResponse(CamelModel):
    cached: bool
    fetched_at: datetime
    destination: str
    check_in: _date
    check_out: _date
    adults: int
    children: int
    total_found: int = 0
    options: list[AirbnbOption]
