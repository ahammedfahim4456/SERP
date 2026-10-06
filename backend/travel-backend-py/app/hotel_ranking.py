"""Smart-choice ranking for hotel results. Pure functions: no I/O, no SerpApi, no cache.

The weights below are judgment calls, not proven values. Tune them after looking at real results.
Everything is computed relative to the results on the page, so scores are only comparable
within one search.
"""
from dataclasses import dataclass
from statistics import median

from .schemas import HotelOption, HotelSearchResponse

PRIOR_REVIEWS = 100          # how strongly we pull ratings with few reviews toward the average
DEFAULT_MEAN_RATING = 4.0
DECENT_MIN_RATING = 3.8      # "decent" floor for the cheapest-decent label
DECENT_MIN_REVIEWS = 50
UNRATED_QUALITY = 0.3
UNPROVEN_PENALTY = 0.75      # score multiplier for properties below the 'decent' bar (few reviews or low rating)
NEUTRAL_LOCATION = 0.5

TAG_TEXT = {
    "kid_friendly": "kid-friendly", "free_breakfast": "free breakfast", "pool": "pool",
    "parking": "parking", "air_conditioning": "air conditioning", "crib": "crib available",
    "kitchen": "kitchen", "wifi": "Wi-Fi", "business_center": "business center",
    "airport_shuttle": "airport shuttle", "room_service": "room service", "laundry": "laundry",
}


@dataclass(frozen=True)
class Profile:
    weights: dict[str, float]          # cost, quality, location, amenities (sum to 1)
    tags: dict[str, int]               # amenity tag -> importance
    rentals_default: bool              # include apartments/houses unless the caller says otherwise


PROFILES: dict[str, Profile] = {
    "family": Profile(
        weights={"cost": 0.30, "quality": 0.25, "location": 0.20, "amenities": 0.25},
        tags={"kid_friendly": 3, "free_breakfast": 3, "pool": 2, "parking": 1,
              "air_conditioning": 1, "crib": 1, "kitchen": 1},
        rentals_default=True),
    "business": Profile(
        weights={"cost": 0.20, "quality": 0.25, "location": 0.25, "amenities": 0.30},
        tags={"wifi": 3, "business_center": 2, "free_breakfast": 2, "airport_shuttle": 1,
              "room_service": 1, "laundry": 1, "parking": 1, "air_conditioning": 1},
        rentals_default=False),
    "budget": Profile(
        weights={"cost": 0.60, "quality": 0.25, "location": 0.05, "amenities": 0.10},
        tags={"free_breakfast": 2, "wifi": 2, "air_conditioning": 1, "parking": 1},
        rentals_default=True),
}


def _clip(x: float) -> float:
    return max(0.0, min(1.0, x))


def adjusted_rating(rating: float, reviews: int, mean: float) -> float:
    """Bayesian average: a 5.0 from 3 reviews must not beat a 4.6 from 2,000."""
    return (reviews / (reviews + PRIOR_REVIEWS)) * rating + (PRIOR_REVIEWS / (reviews + PRIOR_REVIEWS)) * mean


def resolve_profile(name: str | None, children: int) -> str:
    if name:
        if name not in PROFILES:
            raise ValueError("profile must be one of: " + ", ".join(PROFILES))
        return name
    return "family" if children > 0 else "budget"


def rank(base: HotelSearchResponse, profile: str | None, include_rentals: bool | None,
         include_hostels: bool, limit: int) -> HotelSearchResponse:
    name = resolve_profile(profile, base.children)
    prof = PROFILES[name]
    want_rentals = prof.rentals_default if include_rentals is None else include_rentals
    guests = base.adults + base.children

    priced = [o for o in base.options if o.total_price is not None]
    unpriced = len(base.options) - len(priced)

    def allowed(o: HotelOption) -> bool:
        if o.hostel_like and not include_hostels:
            return False
        if o.kind == "rental" and not want_rentals:
            return False
        if o.sleeps is not None and o.sleeps < guests:       # apartment too small for the group
            return False
        return True

    eligible = [o for o in priced if allowed(o)]
    hidden = len(priced) - len(eligible)

    if not eligible:
        return base.model_copy(update={"profile": name, "options": [], "unpriced_count": unpriced,
                                       "hidden_count": hidden})

    rated = [o.rating for o in eligible if o.rating is not None]
    mean = sum(rated) / len(rated) if rated else DEFAULT_MEAN_RATING

    def adj(o: HotelOption) -> float | None:
        if o.rating is None:
            return None
        return adjusted_rating(o.rating, o.review_count or 0, mean)

    n = len(eligible)
    mid_price = median(o.total_price for o in eligible)
    max_tag = sum(prof.tags.values())
    scored: list[tuple[HotelOption, float, float]] = []      # option, score(0-1), share of other options it beats on price
    for o in eligible:
        # Cost is judged against the MEDIAN price: median price scores 0.5, half the median (or less)
        # scores 1.0, double the median 0.25. Unlike a rank, it respects how big a price gap really is
        # and one very expensive outlier cannot distort everything else.
        cost = _clip(0.5 * mid_price / o.total_price)
        pricier = sum(1 for x in eligible if x.total_price > o.total_price)
        cheaper_than = 1.0 if n == 1 else pricier / (n - 1)      # only used for the explanation text
        a = adj(o)
        quality = UNRATED_QUALITY if a is None else _clip((a - 3.0) / 2.0)
        location = NEUTRAL_LOCATION if o.location_rating is None else _clip((o.location_rating - 3.0) / 2.0)
        amen = sum(w for tag, w in prof.tags.items() if tag in o.features) / max_tag
        w = prof.weights
        score = w["cost"] * cost + w["quality"] * quality + w["location"] * location + w["amenities"] * amen
        # a rock-bottom price with almost no reviews (or a low rating) is a risk, not a bargain
        if (o.rating or 0) < DECENT_MIN_RATING or (o.review_count or 0) < DECENT_MIN_REVIEWS:
            score *= UNPROVEN_PENALTY
        scored.append((o, score, cheaper_than))

    scored.sort(key=lambda t: (-t[1], t[0].total_price))

    decent = [o for o in eligible if (o.rating or 0) >= DECENT_MIN_RATING
              and (o.review_count or 0) >= DECENT_MIN_REVIEWS]
    cheapest_decent = min(decent, key=lambda o: o.total_price).id if decent else None
    trusted = [o for o in eligible if (o.review_count or 0) >= 100 and o.rating is not None]
    best_rated = max(trusted, key=lambda o: adj(o)).id if trusted else None

    ranked: list[HotelOption] = []
    for i, (o, score, cheaper_than) in enumerate(scored[:limit]):
        labels = []
        if i == 0:
            labels.append("Top pick")
        if o.id == cheapest_decent:
            labels.append("Cheapest decent option")
        if o.id == best_rated:
            labels.append("Best rated")
        if o.deal:
            labels.append("Priced below usual")

        reasons = []
        if n > 1:
            if cheaper_than == 1.0:
                reasons.append("Cheapest of the options shown")
            else:
                reasons.append(f"Cheaper than {round(cheaper_than * 100)}% of the other options shown")
        if o.rating is not None and o.review_count:
            reasons.append(f"Rated {o.rating:.1f} from {o.review_count:,} reviews")
        if (o.review_count or 0) < DECENT_MIN_REVIEWS:
            reasons.append("Limited review history, treat the rating with caution")
        elif (o.rating or 0) < DECENT_MIN_RATING:
            reasons.append(f"Rating is below {DECENT_MIN_RATING:g}")
        if o.location_rating is not None and o.location_rating >= 4.0:
            reasons.append(f"Location rated {o.location_rating:.1f}")
        matched = sorted((t for t in prof.tags if t in o.features), key=lambda t: -prof.tags[t])[:3]
        if matched:
            reasons.append("Has " + ", ".join(TAG_TEXT.get(t, t) for t in matched))
        if o.kind == "rental" and o.sleeps:
            reasons.append(f"Sleeps {o.sleeps}")

        ranked.append(o.model_copy(update={"score": round(score * 100), "labels": labels, "reasons": reasons}))

    return base.model_copy(update={"profile": name, "options": ranked, "unpriced_count": unpriced,
                                   "hidden_count": hidden})
