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

Docs UI: http://localhost:8000/docs

## Try it
    curl "http://localhost:8000/api/flights/search?origin=MAA&destination=BLR&date=2026-11-10&adults=1"

    curl "http://localhost:8000/api/transit/search?origin=Chennai Central, Chennai&destination=Madurai Junction, Madurai"
    curl "http://localhost:8000/api/hotels/search?destination=Madurai&checkIn=2026-11-05&checkOut=2026-11-07&adults=2"

## Tests (no SerpApi credits used)
    pytest -q
