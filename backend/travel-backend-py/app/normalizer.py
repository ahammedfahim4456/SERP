import re
import unicodedata
from dataclasses import dataclass
from typing import Any

import airportsdata
import pycountry
from countryinfo import CountryInfo

@dataclass(frozen=True)
class NormalizedLocation:
    canonical_id: str
    display_name: str
    iata_code: str | None
    transit_query: str
    state: str | None = None
    country_code: str | None = None


AIRPORTS_BY_IATA = airportsdata.load("IATA")
MULTI_AIRPORT_CITIES = airportsdata.load_iata_macs()


def _fold(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return " ".join("".join(c for c in normalized if not unicodedata.combining(c)).casefold().split())


def _country_match(value: str):
    q = _fold(value)
    for country in pycountry.countries:
        labels = {
            country.name,
            getattr(country, "official_name", ""),
            getattr(country, "common_name", ""),
            country.alpha_2,
            country.alpha_3,
        }
        if q in {_fold(label) for label in labels if label}:
            return country
    return None


def _make_global_location(city: str, country_code: str, iata_codes: list[str] | None = None) -> NormalizedLocation:
    country = pycountry.countries.get(alpha_2=country_code)
    country_name = country.name if country else country_code
    city_name = city.strip()
    codes = iata_codes or []
    return NormalizedLocation(
        canonical_id=f"{_fold(city_name).replace(' ', '_')}:{country_code.lower()}",
        display_name=city_name,
        iata_code=",".join(codes) if codes else None,
        transit_query=f"{city_name}, {country_name}",
        state=country_name,
        country_code=country_code.lower(),
    )


def _find_global_city(value: str) -> NormalizedLocation | None:
    parts = [part.strip() for part in value.split(",") if part.strip()]
    city_query = re.sub(r"[^\w\s]", "", _fold(parts[0]))
    country = _country_match(parts[-1]) if len(parts) > 1 else None
    if len(parts) > 1 and not country:
        # Accept "City, State, Country" while still disambiguating by country.
        country = _country_match(parts[-1])

    # IATA multi-airport city codes (e.g. LON, NYC, PAR) map to all relevant airports.
    mac = MULTI_AIRPORT_CITIES.get(parts[0].upper()) if len(parts[0]) == 3 else None
    if mac and (not country or mac["country"].upper() == country.alpha_2):
        return _make_global_location(mac["name"], mac["country"].upper(), list(mac["airports"].keys()))

    # A direct airport code is unambiguous and is accepted by Google Flights.
    airport = AIRPORTS_BY_IATA.get(parts[0].upper()) if len(parts[0]) == 3 else None
    if airport and (not country or airport["country"] == country.alpha_2):
        return _make_global_location(airport["city"], airport["country"], [airport["iata"]])

    matches = [
        row for row in AIRPORTS_BY_IATA.values()
        if re.sub(r"[^\w\s]", "", _fold(row.get("city") or "")) == city_query
        and (not country or row.get("country") == country.alpha_2)
    ]
    if matches:
        codes = sorted({row["iata"] for row in matches if row.get("iata")})
        city = matches[0]["city"]
        cc = matches[0]["country"]
        mac = next((
            value for value in MULTI_AIRPORT_CITIES.values()
            if re.sub(r"[^\w\s]", "", _fold(value["name"])) == city_query and value["country"].upper() == cc
        ), None)
        if mac:
            codes = list(mac["airports"].keys())
        elif len(codes) > 1:
            # Keep the request within Google Flights' supported alternative-airport syntax.
            codes = codes[:5]
        return _make_global_location(city, cc, codes)

    return None


# Canonical mappings for common Indian travel hubs & popular leisure/heritage destinations
LOCATION_ALIASES: dict[str, NormalizedLocation] = {
    # Bengaluru
    "bengaluru": NormalizedLocation("bengaluru", "Bengaluru", "BLR", "Bengaluru City Junction, Bengaluru", "Karnataka"),
    "bangalore": NormalizedLocation("bengaluru", "Bengaluru", "BLR", "Bengaluru City Junction, Bengaluru", "Karnataka"),
    "banglore": NormalizedLocation("bengaluru", "Bengaluru", "BLR", "Bengaluru City Junction, Bengaluru", "Karnataka"),
    "blr": NormalizedLocation("bengaluru", "Bengaluru", "BLR", "Bengaluru City Junction, Bengaluru", "Karnataka"),
    
    # Chennai
    "chennai": NormalizedLocation("chennai", "Chennai", "MAA", "Chennai Central, Chennai", "Tamil Nadu"),
    "madras": NormalizedLocation("chennai", "Chennai", "MAA", "Chennai Central, Chennai", "Tamil Nadu"),
    "maa": NormalizedLocation("chennai", "Chennai", "MAA", "Chennai Central, Chennai", "Tamil Nadu"),

    # Madurai
    "madurai": NormalizedLocation("madurai", "Madurai", "IXM", "Madurai Junction, Madurai", "Tamil Nadu"),
    "ixm": NormalizedLocation("madurai", "Madurai", "IXM", "Madurai Junction, Madurai", "Tamil Nadu"),

    # Mumbai
    "mumbai": NormalizedLocation("mumbai", "Mumbai", "BOM", "Mumbai Central, Mumbai", "Maharashtra"),
    "bombay": NormalizedLocation("mumbai", "Mumbai", "BOM", "Mumbai Central, Mumbai", "Maharashtra"),
    "bom": NormalizedLocation("mumbai", "Mumbai", "BOM", "Mumbai Central, Mumbai", "Maharashtra"),

    # Delhi
    "delhi": NormalizedLocation("delhi", "New Delhi", "DEL", "New Delhi Railway Station, New Delhi", "Delhi"),
    "new delhi": NormalizedLocation("delhi", "New Delhi", "DEL", "New Delhi Railway Station, New Delhi", "Delhi"),
    "newdelhi": NormalizedLocation("delhi", "New Delhi", "DEL", "New Delhi Railway Station, New Delhi", "Delhi"),
    "del": NormalizedLocation("delhi", "New Delhi", "DEL", "New Delhi Railway Station, New Delhi", "Delhi"),

    # Gokarna
    "gokarna": NormalizedLocation("gokarna", "Gokarna", "GOI", "Gokarna Road, Gokarna", "Karnataka"),
    "gokarn": NormalizedLocation("gokarna", "Gokarna", "GOI", "Gokarna Road, Gokarna", "Karnataka"),

    # Pondicherry
    "pondicherry": NormalizedLocation("pondicherry", "Pondicherry", "MAA", "Puducherry, Tamil Nadu", "Puducherry"),
    "puducherry": NormalizedLocation("pondicherry", "Pondicherry", "MAA", "Puducherry, Tamil Nadu", "Puducherry"),
    "pondy": NormalizedLocation("pondicherry", "Pondicherry", "MAA", "Puducherry, Tamil Nadu", "Puducherry"),
    "pny": NormalizedLocation("pondicherry", "Pondicherry", "MAA", "Puducherry, Tamil Nadu", "Puducherry"),

    # Goa
    "goa": NormalizedLocation("goa", "Goa", "GOI", "Madgaon Junction, Goa", "Goa"),
    "goi": NormalizedLocation("goa", "Goa", "GOI", "Madgaon Junction, Goa", "Goa"),
    "gox": NormalizedLocation("goa", "Goa", "GOX", "Madgaon Junction, Goa", "Goa"),
    "panaji": NormalizedLocation("goa", "Goa", "GOI", "Madgaon Junction, Goa", "Goa"),
    "madgaon": NormalizedLocation("goa", "Goa", "GOI", "Madgaon Junction, Goa", "Goa"),

    # Hyderabad
    "hyderabad": NormalizedLocation("hyderabad", "Hyderabad", "HYD", "Secunderabad Junction, Hyderabad", "Telangana"),
    "hyd": NormalizedLocation("hyderabad", "Hyderabad", "HYD", "Secunderabad Junction, Hyderabad", "Telangana"),
    "secunderabad": NormalizedLocation("hyderabad", "Hyderabad", "HYD", "Secunderabad Junction, Hyderabad", "Telangana"),

    # Kolkata
    "kolkata": NormalizedLocation("kolkata", "Kolkata", "CCU", "Howrah Junction, Kolkata", "West Bengal"),
    "calcutta": NormalizedLocation("kolkata", "Kolkata", "CCU", "Howrah Junction, Kolkata", "West Bengal"),
    "ccu": NormalizedLocation("kolkata", "Kolkata", "CCU", "Howrah Junction, Kolkata", "West Bengal"),

    # Mysuru
    "mysuru": NormalizedLocation("mysuru", "Mysuru", "MYQ", "Mysuru Junction, Mysuru", "Karnataka"),
    "mysore": NormalizedLocation("mysuru", "Mysuru", "MYQ", "Mysuru Junction, Mysuru", "Karnataka"),
    "myq": NormalizedLocation("mysuru", "Mysuru", "MYQ", "Mysuru Junction, Mysuru", "Karnataka"),

    # Coimbatore
    "coimbatore": NormalizedLocation("coimbatore", "Coimbatore", "CJB", "Coimbatore Junction, Coimbatore", "Tamil Nadu"),
    "kovai": NormalizedLocation("coimbatore", "Coimbatore", "CJB", "Coimbatore Junction, Coimbatore", "Tamil Nadu"),
    "cjb": NormalizedLocation("coimbatore", "Coimbatore", "CJB", "Coimbatore Junction, Coimbatore", "Tamil Nadu"),

    # Kochi
    "kochi": NormalizedLocation("kochi", "Kochi", "COK", "Ernakulam Junction, Kochi", "Kerala"),
    "cochin": NormalizedLocation("kochi", "Kochi", "COK", "Ernakulam Junction, Kochi", "Kerala"),
    "ernakulam": NormalizedLocation("kochi", "Kochi", "COK", "Ernakulam Junction, Kochi", "Kerala"),
    "cok": NormalizedLocation("kochi", "Kochi", "COK", "Ernakulam Junction, Kochi", "Kerala"),

    # Thiruvananthapuram
    "thiruvananthapuram": NormalizedLocation("thiruvananthapuram", "Thiruvananthapuram", "TRV", "Thiruvananthapuram Central", "Kerala"),
    "trivandrum": NormalizedLocation("thiruvananthapuram", "Thiruvananthapuram", "TRV", "Thiruvananthapuram Central", "Kerala"),
    "trv": NormalizedLocation("thiruvananthapuram", "Thiruvananthapuram", "TRV", "Thiruvananthapuram Central", "Kerala"),

    # Jaipur
    "jaipur": NormalizedLocation("jaipur", "Jaipur", "JAI", "Jaipur Junction, Jaipur", "Rajasthan"),
    "jai": NormalizedLocation("jaipur", "Jaipur", "JAI", "Jaipur Junction, Jaipur", "Rajasthan"),

    # Varanasi
    "varanasi": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),
    "banaras": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),
    "kashi": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),
    "vns": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),

    # Ooty & Kodaikanal
    "ooty": NormalizedLocation("ooty", "Ooty", "CJB", "Udagamandalam, Ooty", "Tamil Nadu"),
    "udhagamandalam": NormalizedLocation("ooty", "Ooty", "CJB", "Udagamandalam, Ooty", "Tamil Nadu"),
    "kodaikanal": NormalizedLocation("kodaikanal", "Kodaikanal", "IXM", "Kodaikanal Road, Tamil Nadu", "Tamil Nadu"),
    "kodai": NormalizedLocation("kodaikanal", "Kodaikanal", "IXM", "Kodaikanal Road, Tamil Nadu", "Tamil Nadu"),

    # Tamil script aliases (தமிழ்)
    "சென்னை": NormalizedLocation("chennai", "Chennai", "MAA", "Chennai Central, Chennai", "Tamil Nadu"),
    "மதுரை": NormalizedLocation("madurai", "Madurai", "IXM", "Madurai Junction, Madurai", "Tamil Nadu"),
    "கோயம்புத்தூர்": NormalizedLocation("coimbatore", "Coimbatore", "CJB", "Coimbatore Junction, Coimbatore", "Tamil Nadu"),
    "கோவை": NormalizedLocation("coimbatore", "Coimbatore", "CJB", "Coimbatore Junction, Coimbatore", "Tamil Nadu"),
    "ஊட்டி": NormalizedLocation("ooty", "Ooty", "CJB", "Udagamandalam, Ooty", "Tamil Nadu"),
    "பெங்களூரு": NormalizedLocation("bengaluru", "Bengaluru", "BLR", "Bengaluru City Junction, Bengaluru", "Karnataka"),
    "பாண்டிச்சேரி": NormalizedLocation("pondicherry", "Pondicherry", "MAA", "Puducherry, Tamil Nadu", "Puducherry"),
    "கோவா": NormalizedLocation("goa", "Goa", "GOI", "Madgaon Junction, Goa", "Goa"),

    # Hindi / Devanagari script aliases (हिंदी)
    "दिल्ली": NormalizedLocation("delhi", "New Delhi", "DEL", "New Delhi Railway Station, New Delhi", "Delhi"),
    "नई दिल्ली": NormalizedLocation("delhi", "New Delhi", "DEL", "New Delhi Railway Station, New Delhi", "Delhi"),
    "वाराणसी": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),
    "काशी": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),
    "बनारस": NormalizedLocation("varanasi", "Varanasi", "VNS", "Varanasi Junction, Varanasi", "Uttar Pradesh"),
    "मुंबई": NormalizedLocation("mumbai", "Mumbai", "BOM", "Mumbai Central, Mumbai", "Maharashtra"),
    "जयपुर": NormalizedLocation("jaipur", "Jaipur", "JAI", "Jaipur Junction, Jaipur", "Rajasthan"),
    "बेंगलुरु": NormalizedLocation("bengaluru", "Bengaluru", "BLR", "Bengaluru City Junction, Bengaluru", "Karnataka"),
    "गोवा": NormalizedLocation("goa", "Goa", "GOI", "Madgaon Junction, Goa", "Goa"),
}


def normalize_location(raw_text: str) -> NormalizedLocation:
    """
    Normalizes any city name, alternative spelling, or airport code into a canonical location.
    Maps 'Bangalore', 'Bengaluru', and 'BLR' to the exact same canonical_id to ensure cache hits.
    """
    if not raw_text:
        return NormalizedLocation("unknown", "Unknown", None, "Unknown")

    raw = raw_text.strip()
    if not raw:
        return NormalizedLocation("unknown", "Unknown", None, "Unknown")

    # Keep existing custom aliases first so their city-specific rail stations remain intact.
    original_lower = raw.lower()
    if original_lower in LOCATION_ALIASES:
        loc = LOCATION_ALIASES[original_lower]
        return NormalizedLocation(
            loc.canonical_id, loc.display_name, loc.iata_code, loc.transit_query,
            loc.state, "in" if loc.state else None,
        )

    global_city = _find_global_city(raw)
    if global_city:
        return global_city

    country = _country_match(raw)
    if country:
        try:
            capital = CountryInfo(country.alpha_2).info().get("capital")
        except (KeyError, TypeError, ValueError):
            capital = None
        if isinstance(capital, list):
            capital = capital[0] if capital else None
        if capital:
            capital_location = _find_global_city(capital)
            if not capital_location:
                capital_alias = LOCATION_ALIASES.get(capital.strip().lower())
                if capital_alias:
                    capital_location = NormalizedLocation(
                        capital_alias.canonical_id, capital_alias.display_name,
                        capital_alias.iata_code, capital_alias.transit_query,
                        capital_alias.state, country.alpha_2.lower(),
                    )
            if capital_location and capital_location.iata_code:
                return NormalizedLocation(
                    f"country:{country.alpha_2.lower()}", country.name,
                    capital_location.iata_code,
                    f"{capital_location.display_name}, {country.name}",
                    country.name, country.alpha_2.lower(),
                )
        # Some countries have no airport in their capital. Search their IATA airports.
        country_airports = sorted({
            row["iata"] for row in AIRPORTS_BY_IATA.values()
            if row.get("country") == country.alpha_2 and row.get("iata")
        })[:5]
        return NormalizedLocation(
            f"country:{country.alpha_2.lower()}", country.name,
            ",".join(country_airports) if country_airports else None,
            country.name, country.name, country.alpha_2.lower(),
        )

    cleaned = raw.lower()
    cleaned = re.sub(r"\b(city|junction|station|airport|railway|central)\b", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if cleaned in LOCATION_ALIASES:
        return LOCATION_ALIASES[cleaned]

    # Resolve only real codes from the bundled airport reference data. An unknown
    # three-letter value is not a usable airport code and must not reach pricing.
    if len(raw) == 3 and raw.isalpha():
        iata = raw.upper()
        airport = AIRPORTS_BY_IATA.get(iata)
        if airport:
            return _make_global_location(airport["city"], airport["country"], [iata])

    # General fallback: standardized title case
    title_name = raw.title()
    slug_id = re.sub(r"[^a-z0-9]+", "_", raw.lower()).strip("_")
    return NormalizedLocation(
        canonical_id=slug_id or "unknown",
        display_name=title_name,
        iata_code=None,
        transit_query=f"{title_name} Junction, {title_name}",
    )


def get_known_cities(search_query: str | None = None) -> list[dict[str, Any]]:
    coordinates = {
        "bengaluru": (12.9716, 77.5946),
        "chennai": (13.0827, 80.2707),
        "coimbatore": (11.0168, 76.9558),
        "goa": (15.2993, 74.1240),
        "gokarna": (14.5479, 74.3188),
        "hyderabad": (17.3850, 78.4867),
        "jaipur": (26.9124, 75.7873),
        "kochi": (9.9312, 76.2673),
        "kodaikanal": (10.2381, 77.4892),
        "kolkata": (22.5726, 88.3639),
        "madurai": (9.9252, 78.1198),
        "mumbai": (19.0760, 72.8777),
        "mysuru": (12.2958, 76.6394),
        "delhi": (28.6139, 77.2090),
        "ooty": (11.4102, 76.6950),
        "pondicherry": (11.9416, 79.8083),
        "thiruvananthapuram": (8.5241, 76.9366),
        "varanasi": (25.3176, 82.9739),
    }
    seen = set()
    result = []
    for loc in LOCATION_ALIASES.values():
        if loc.canonical_id not in seen:
            seen.add(loc.canonical_id)
            result.append({
                "canonicalId": loc.canonical_id,
                "displayName": loc.display_name,
                "iataCode": loc.iata_code,
                "transitQuery": loc.transit_query,
                "state": loc.state,
                "latitude": coordinates.get(loc.canonical_id, (None, None))[0],
                "longitude": coordinates.get(loc.canonical_id, (None, None))[1],
            })
    
    if not search_query or len(search_query.strip()) < 2:
        return sorted(result, key=lambda x: x["displayName"])

    q = _fold(search_query)
    matches: list[dict[str, Any]] = []

    # Countries are selectable too; country searches use the capital airport.
    for country in pycountry.countries:
        labels = [
            country.name,
            getattr(country, "official_name", ""),
            getattr(country, "common_name", ""),
            country.alpha_2,
            country.alpha_3,
        ]
        label = next((label for label in labels if label and q in _fold(label)), None)
        if label:
            loc = normalize_location(country.name)
            matches.append({
                "canonicalId": loc.canonical_id,
                "displayName": country.name,
                "iataCode": loc.iata_code,
                "transitQuery": loc.transit_query,
                "state": country.name,
                "countryCode": country.alpha_2.lower(),
                "locationType": "country",
                "latitude": None,
                "longitude": None,
            })

    seen = set()
    if len(search_query.strip()) == 3:
        code_location = normalize_location(search_query.strip())
        if code_location.iata_code:
            airport_city = next((
                row for row in AIRPORTS_BY_IATA.values()
                if search_query.strip().upper() in (row.get("iata"),)
            ), None)
            if airport_city:
                country_name = pycountry.countries.get(alpha_2=airport_city["country"])
                matches.append({
                    "canonicalId": code_location.canonical_id,
                    "displayName": f"{airport_city['city']}, {country_name.name if country_name else airport_city['country']}",
                    "iataCode": code_location.iata_code,
                    "transitQuery": code_location.transit_query,
                    "state": country_name.name if country_name else airport_city["country"],
                    "countryCode": airport_city["country"].lower(),
                    "locationType": "airport",
                    "latitude": coordinates.get(normalize_location(airport_city["city"]).canonical_id, (None, None))[0],
                    "longitude": coordinates.get(normalize_location(airport_city["city"]).canonical_id, (None, None))[1],
                })
    for airport in AIRPORTS_BY_IATA.values():
        city = (airport.get("city") or "").strip()
        if not city or q not in _fold(city):
            continue
        identity = (_fold(city), airport["country"])
        if identity in seen:
            continue
        seen.add(identity)
        loc = _find_global_city(f"{city}, {airport['country']}")
        if not loc:
            continue
        country_name = pycountry.countries.get(alpha_2=airport["country"])
        matches.append({
            "canonicalId": loc.canonical_id,
            "displayName": f"{city}, {country_name.name if country_name else airport['country']}",
            "iataCode": loc.iata_code,
            "transitQuery": loc.transit_query,
            "state": country_name.name if country_name else airport["country"],
            "countryCode": airport["country"].lower(),
            "locationType": "city",
            "latitude": coordinates.get(normalize_location(city).canonical_id, (None, None))[0],
            "longitude": coordinates.get(normalize_location(city).canonical_id, (None, None))[1],
        })

    # Prefer exact/prefix city matches and keep autocomplete responses small.
    matches.sort(key=lambda item: (not _fold(item["displayName"]).startswith(q), item["displayName"]))
    return matches[:10]
