import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class NormalizedLocation:
    canonical_id: str
    display_name: str
    iata_code: str | None
    transit_query: str
    state: str | None = None


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

    cleaned = raw_text.strip().lower()
    cleaned = re.sub(r"\b(city|junction|station|airport|railway|central)\b", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if cleaned in LOCATION_ALIASES:
        return LOCATION_ALIASES[cleaned]

    # Try lookup of exact original lowercased
    original_lower = raw_text.strip().lower()
    if original_lower in LOCATION_ALIASES:
        return LOCATION_ALIASES[original_lower]

    # Check if looks like 3-letter IATA code
    if len(raw_text.strip()) == 3 and raw_text.strip().isalpha():
        iata = raw_text.strip().upper()
        return NormalizedLocation(
            canonical_id=raw_text.strip().lower(),
            display_name=raw_text.strip().title(),
            iata_code=iata,
            transit_query=f"{raw_text.strip().title()} Railway Station",
        )

    # General fallback: standardized title case
    title_name = raw_text.strip().title()
    slug_id = re.sub(r"[^a-z0-9]+", "_", raw_text.strip().lower()).strip("_")
    return NormalizedLocation(
        canonical_id=slug_id or "unknown",
        display_name=title_name,
        iata_code=None,
        transit_query=f"{title_name} Junction, {title_name}",
    )


def get_known_cities(search_query: str | None = None) -> list[dict[str, Any]]:
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
            })
    
    if search_query:
        q = search_query.strip().lower()
        result = [c for c in result if q in c["displayName"].lower() or (c["iataCode"] and q in c["iataCode"].lower()) or (c["state"] and q in c["state"].lower())]
        
    return sorted(result, key=lambda x: x["displayName"])

