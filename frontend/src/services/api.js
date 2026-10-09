/**
 * API service layer – calls the FastAPI backend and transforms responses
 * into the shapes the frontend components already expect.
 *
 * Set VITE_API_BASE_URL to the FastAPI origin when the frontend and API do not
 * share a host. Empty by default so Vite's /api proxy continues to work locally.
 */

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const BASE = `${API_ORIGIN}/api`;

// ─── helpers ───────────────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

function qs(params) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out.append(k, v);
  }
  return out.toString();
}

// ─── Flights ───────────────────────────────────────────────────
/**
 * @returns {{ cached, fetchedAt, origin, destination, adults, children, options[] }}
 * Each option carries a provider itinerary total; tax inclusion may be unknown.
 */
export async function searchFlights(origin, destination, date, returnDate, adults = 1, children = 0, currency = 'INR') {
  const q = qs({ origin, destination, date, returnDate, adults, children, currency });
  return fetchJSON(`${BASE}/flights/search?${q}`);
}

// ─── Transit ───────────────────────────────────────────────────
/**
 * @returns {{ cached, fetchedAt, origin, destination, options[] }}
 * Each option: { departureTime, arrivalTime, durationMinutes, walkingMinutes, fare, currency, mainMode, legs[] }
 */
export async function searchTransit(origin, destination) {
  const q = qs({ origin, destination });
  return fetchJSON(`${BASE}/transit/search?${q}`);
}

// ─── Hotels ────────────────────────────────────────────────────
/**
 * @returns {{ cached, fetchedAt, destination, checkIn, checkOut, nights, adults, children, profile, options[] }}
 */
export async function searchHotels(destination, checkIn, checkOut, adults = 2, {
  children = 0, childAges, currency = 'INR', profile, includeRentals, includeHostels, limit = 10
} = {}) {
  const q = qs({ destination, checkIn, checkOut, adults, children, childAges, currency, profile, includeRentals, includeHostels, limit });
  return fetchJSON(`${BASE}/hotels/search?${q}`);
}

// ─── Food (nearby restaurants) ─────────────────────────────────
/**
 * @returns {{ cached, fetchedAt, query, anchor, profile, partySize, totalFound, hiddenCount, options[] }}
 */
export async function searchFood(lat, lng, {
  category = 'any', cuisine, vegetarianOnly = false, meal, maxDistanceKm = 3, minRating,
  adults = 2, children = 0, profile, limit = 10
} = {}) {
  const q = qs({ lat, lng, category, cuisine, vegetarianOnly, meal, maxDistanceKm, minRating, adults, children, profile, limit });
  return fetchJSON(`${BASE}/food/search?${q}`);
}

// ─── TripAdvisor Recommendations ──────────────────────────────
export async function searchTripadvisor(destination, budget) {
  const q = qs({ destination, budget });
  return fetchJSON(`${BASE}/recommendations/tripadvisor?${q}`);
}

// ─── Usage / Quota ─────────────────────────────────────────────
export async function getUsage() {
  return fetchJSON(`${BASE}/usage`);
}

// ─── AI Endpoints (Tracks 1 - 5) ──────────────────────────────
export async function parseTripPrompt(prompt) {
  const res = await fetch(`${BASE}/ai/parse-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`AI Parse error ${res.status}`);
  return res.json();
}

export async function planTripAi(prompt) {
  const res = await fetch(`${BASE}/ai/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`AI Plan error ${res.status}`);
  return res.json();
}

export async function explainPick(itemType, itemData, profile = 'family', language = 'en') {
  const res = await fetch(`${BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_type: itemType, item_data: itemData, profile, language }),
  });
  if (!res.ok) throw new Error(`AI Explain error ${res.status}`);
  return res.json();
}

export async function getAiCostSummary(payload) {
  const res = await fetch(`${BASE}/ai/cost-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AI Cost error ${res.status}`);
  return res.json();
}

export async function normalizeCity(location) {
  return fetchJSON(`${BASE}/ai/normalize?location=${encodeURIComponent(location)}`);
}

export async function getCities(query = '') {
  const q = query ? `?q=${encodeURIComponent(query)}` : '';
  return fetchJSON(`${BASE}/cities${q}`);
}
