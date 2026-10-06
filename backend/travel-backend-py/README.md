# Travel Assistant backend (FastAPI)

## Run
    python -m venv .venv
    .venv\Scripts\activate          # Windows  (Mac/Linux: source .venv/bin/activate)
    pip install -r requirements.txt
    copy .env.example .env           # then put your SerpApi key in .env
    uvicorn app.main:app --reload

Docs UI: http://localhost:8000/docs

## Try it
    curl "http://localhost:8000/api/flights/search?origin=MAA&destination=BLR&date=2026-11-10&adults=1"

    curl "http://localhost:8000/api/transit/search?origin=Chennai Central, Chennai&destination=Madurai Junction, Madurai"
    curl "http://localhost:8000/api/hotels/search?destination=Madurai&checkIn=2026-11-05&checkOut=2026-11-07&adults=2"

## Tests (no SerpApi credits used)
    pytest -q
