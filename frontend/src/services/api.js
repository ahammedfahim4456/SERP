/**
 * API service layer – calls the FastAPI backend and transforms responses
 * into the shapes the frontend components already expect.
 *
 * The Vite dev-server proxies /api → http://localhost:8000 so no CORS issues.
 */

const BASE = '/api';

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
 * @returns {{ cached, fetchedAt, origin, destination, options[] }}
 * Each option: { category, airline, price, currency, totalDurationMinutes, stops, segments[] }
 */
export async function searchFlights(origin, destination, date, returnDate, adults = 1, currency = 'INR') {
  const q = qs({ origin, destination, date, returnDate, adults, currency });
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
