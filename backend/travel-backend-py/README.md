# Travel Assistant backend (FastAPI)

## First-time setup (do this once)
    python -m venv .venv
    .venv\Scripts\activate          # Windows  (Mac/Linux: source .venv/bin/activate)
    pip install -r requirements.txt
    copy .env.example .env           # ONCE ONLY: this overwrites .env. Then paste your SerpApi key into .env

## Every time after that
    cd backend\travel-backend-py
    .venv\Scripts\activate
    uvicorn app.main:app --reload

Never re-run the `copy .env.example .env` line: it replaces your real `.env` (and your key) with the blank template.
Never share screenshots of `.env`.

## MySQL query history

Create a MySQL database (for example, `serp_travel`), then fill in `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` in `backend/travel-backend-py/.env`. Set `MYSQL_SSL=true` for hosted databases that require TLS (including TiDB Cloud Starter); local MySQL can keep the default `false`. The backend creates the `api_query_log` table at startup. Every request under `/api/` is recorded with its URL/query parameters, request body, response status, error detail, duration, and timestamp. If MySQL is missing or a query cannot be saved, startup fails or the request returns HTTP 503; the backend does not silently continue without persistence.

Do not commit `.env` or put database credentials in source files. The `.env` file is ignored by Git.

## International city and country searches

The search form accepts global airport cities and country names. City lookups use the bundled worldwide IATA airport reference data; multi-airport cities can search several airport codes together. A country-only flight search resolves to that country's capital airport when one is available in the reference data. Hotel searches use the destination country code for localized results. Locations without a matching IATA airport can still be used for hotel/transit searches, but cannot produce flight results.

Docs UI: http://localhost:8000/docs

## Try it
    curl "http://localhost:8000/api/flights/search?origin=MAA&destination=BLR&date=2026-11-10&adults=1"

    curl "http://localhost:8000/api/transit/search?origin=Chennai Central, Chennai&destination=Madurai Junction, Madurai"
    curl "http://localhost:8000/api/hotels/search?destination=Madurai&checkIn=2026-11-05&checkOut=2026-11-07&adults=2"

## Tests (no SerpApi credits used)
    pytest -q
# Flight pricing and booking display

Google Flights results are displayed as the provider's quoted itinerary total for the selected adult and child counts. The API response does not provide a reliable GST/fee breakdown or confirm whether every tax is included, so the UI labels tax inclusion as unspecified instead of estimating a split or dividing the quote into a per-person price. Flight cards show the available segment departure/arrival times. A provider-supplied direct link is used when present; otherwise the card opens a Google Flights search for the selected route and dates.

Hotel cards show the rating and review count returned with Google Hotels property results and link to the matching Google Maps search. This project does not fetch or reproduce individual Maps review text.
