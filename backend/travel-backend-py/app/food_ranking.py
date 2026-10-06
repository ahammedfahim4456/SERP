"""Smart-choice ranking for restaurants near a point. Pure functions: no I/O.

Weights are judgment calls, not proven values: tune them after looking at real results.
Scores are relative to the places on the page, so only comparable within one search.
"""
from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt
from statistics import median

from .schemas import Coordinates, FoodOption, FoodSearchResponse

PRIOR_REVIEWS = 100
DEFAULT_MEAN_RATING = 4.2
DECENT_MIN_RATING = 4.0
DECENT_MIN_REVIEWS = 50
UNPROVEN_PENALTY = 0.75
UNRATED_QUALITY = 0.3
NEUTRAL = 0.5
FAR_KM = 3.0                 # distance score reaches 0 at this distance
WALK_MIN_PER_KM = 12         # about 5 km/h

TAG_TEXT = {
    "kid_friendly": "good for kids", "family_friendly": "family friendly", "groups": "good for groups",
    "reservations": "takes reservations", "parking": "parking", "quiet": "quiet atmosphere",
    "quick_bite": "quick bites", "wifi": "Wi-Fi", "dine_in": "dine-in", "takeaway": "takeaway",
    "delivery": "delivery", "vegetarian_only": "vegetarian only", "high_chairs": "high chairs",
}


@dataclass(frozen=True)
class Profile:
    weights: dict[str, float]      # quality, distance, price, fit (sum to 1)
    tags: dict[str, int]


PROFILES: dict[str, Profile] = {
    "family": Profile({"quality": 0.30, "distance": 0.20, "price": 0.25, "fit": 0.25},
                      {"kid_friendly": 3, "family_friendly": 2, "high_chairs": 1, "groups": 1,
                       "reservations": 1, "parking": 1, "dine_in": 1}),
    "business": Profile({"quality": 0.35, "distance": 0.25, "price": 0.10, "fit": 0.30},
                        {"reservations": 3, "quiet": 2, "quick_bite": 2, "wifi": 1, "parking": 1, "dine_in": 1}),
    "budget": Profile({"quality": 0.30, "distance": 0.15, "price": 0.45, "fit": 0.10},
                      {"quick_bite": 2, "takeaway": 1, "delivery": 1}),
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * 6371.0 * asin(sqrt(a))


def _clip(x: float) -> float:
    return max(0.0, min(1.0, x))


def adjusted_rating(rating: float, reviews: int, mean: float) -> float:
    return (reviews / (reviews + PRIOR_REVIEWS)) * rating + (PRIOR_REVIEWS / (reviews + PRIOR_REVIEWS)) * mean


def resolve_profile(name: str | None, children: int) -> str:
    if name:
        if name not in PROFILES:
            raise ValueError("profile must be one of: " + ", ".join(PROFILES))
        return name
    return "family" if children > 0 else "budget"


def rank(base: FoodSearchResponse, lat: float, lng: float, profile: str | None, children: int,
         party_size: int, meal: str | None, max_km: float, min_rating: float | None,
         vegetarian_only: bool, limit: int) -> FoodSearchResponse:
    name = resolve_profile(profile, children)
    prof = PROFILES[name]

    placed: list[FoodOption] = []
    hidden = 0
    for o in base.options:
        if o.coordinates is None:
            hidden += 1
            continue
        km = haversine_km(lat, lng, o.coordinates.latitude, o.coordinates.longitude)
        if (km > max_km
                or (min_rating is not None and (o.rating or 0) < min_rating)
                or (vegetarian_only and "vegetarian_only" not in o.features)
                or (meal and o.meals and meal not in o.meals)):      # unknown meals are kept
            hidden += 1
            continue
        est = o.estimated_per_person
        placed.append(o.model_copy(update={
            "distance_km": round(km, 2), "walk_minutes": round(km * WALK_MIN_PER_KM),
            "estimated_meal_cost": est * party_size if est is not None else None}))

    if not placed:
        return base.model_copy(update={"profile": name, "party_size": party_size, "options": [],
                                       "hidden_count": hidden, "anchor": Coordinates(latitude=lat, longitude=lng)})

    rated = [o.rating for o in placed if o.rating is not None]
    mean = sum(rated) / len(rated) if rated else DEFAULT_MEAN_RATING
    prices = [o.estimated_per_person for o in placed if o.estimated_per_person]
    mid_price = median(prices) if prices else None
    max_tag = sum(prof.tags.values())

    def adj(o: FoodOption) -> float | None:
        return None if o.rating is None else adjusted_rating(o.rating, o.review_count or 0, mean)

    scored = []
    for o in placed:
        a = adj(o)
        quality = UNRATED_QUALITY if a is None else _clip((a - 3.5) / 1.5)     # restaurants rate high, so 3.5 to 5.0
        distance = _clip(1 - o.distance_km / FAR_KM)
        price = NEUTRAL if not (mid_price and o.estimated_per_person) else _clip(0.5 * mid_price / o.estimated_per_person)
        fit = sum(w for t, w in prof.tags.items() if t in o.features) / max_tag
        w = prof.weights
        score = w["quality"] * quality + w["distance"] * distance + w["price"] * price + w["fit"] * fit
        if (o.rating or 0) < DECENT_MIN_RATING or (o.review_count or 0) < DECENT_MIN_REVIEWS:
            score *= UNPROVEN_PENALTY
        scored.append((o, score))
    def is_decent(o: FoodOption) -> bool:
        return (o.rating or 0) >= DECENT_MIN_RATING and (o.review_count or 0) >= DECENT_MIN_REVIEWS

    # a cheap place with almost no reviews (or a low rating) is a risk, not a bargain: it may never
    # outrank a decent one, however well it scores on price
    scored.sort(key=lambda t: (not is_decent(t[0]), -t[1], t[0].distance_km))

    decent = [o for o in placed if is_decent(o)]
    closest = min(decent, key=lambda o: o.distance_km).id if decent else None
    priced_decent = [o for o in decent if o.estimated_per_person]
    cheapest = min(priced_decent, key=lambda o: o.estimated_per_person).id if priced_decent else None
    trusted = [o for o in placed if (o.review_count or 0) >= 100 and o.rating is not None]
    best_rated = max(trusted, key=adj).id if trusted else None

    ranked = []
    for i, (o, score) in enumerate(scored[:limit]):
        labels = []
        if i == 0:
            labels.append("Top pick")
        if o.id == closest:
            labels.append("Closest decent option")
        if o.id == cheapest:
            labels.append("Cheapest decent option")
        if o.id == best_rated:
            labels.append("Best rated")

        reasons = [f"{o.distance_km:.1f} km away (about {o.walk_minutes} min on foot, straight line)"]
        if o.rating is not None and o.review_count:
            reasons.append(f"Rated {o.rating:.1f} from {o.review_count:,} reviews")
        if (o.review_count or 0) < DECENT_MIN_REVIEWS:
            reasons.append("Limited review history, treat the rating with caution")
        elif (o.rating or 0) < DECENT_MIN_RATING:
            reasons.append(f"Rating is below {DECENT_MIN_RATING:g}")
        if o.estimated_per_person:
            reasons.append(f"About ₹{o.estimated_per_person:,} per person (rough estimate)")
        matched = sorted((t for t in prof.tags if t in o.features), key=lambda t: -prof.tags[t])[:3]
        if matched:
            reasons.append("Has " + ", ".join(TAG_TEXT.get(t, t) for t in matched))
        if "vegetarian_only" in o.features and "vegetarian_only" not in matched:
            reasons.append("Listed as vegetarian only")
        ranked.append(o.model_copy(update={"score": round(score * 100), "labels": labels, "reasons": reasons}))

    return base.model_copy(update={"profile": name, "party_size": party_size, "options": ranked,
                                   "hidden_count": hidden, "anchor": Coordinates(latitude=lat, longitude=lng)})
