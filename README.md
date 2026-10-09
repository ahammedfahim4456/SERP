# SERP Travel Planner

A full-stack travel planner with a React/Vite frontend and a FastAPI backend. Search flights, ground routes, stays, nearby food and destination recommendations, then review a trip cost summary.

## Repository layout

```text
frontend/                       React + Vite application
  public/                       Brand assets
  src/                          Screens, components and API client
backend/travel-backend-py/      FastAPI application
  app/                          Routes and travel-service logic
  scripts/                      Development and verification utilities
  tests/                        Backend tests and fixtures
docs/                           Project guides and architecture material
```

## Run locally on Windows

### 1. Configure the backend

From the repository root, enter `backend\travel-backend-py`, create a virtual environment, install the requirements, and copy `.env.example` to `.env` **once**. Fill in the SerpApi, Gemini and MySQL settings in `.env`. MySQL must be available because API request history is stored there. Never commit or share `.env`.

```bat
cd backend\travel-backend-py
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Keep the backend terminal open. The API docs are at `http://127.0.0.1:8000/docs`.

### 2. Start the frontend in a second terminal

```bat
cd frontend
npm install
npm run dev -- --port 3000
```

Open `http://127.0.0.1:3000/`. Vite proxies `/api/*` requests to the backend at `http://127.0.0.1:8000`. Set `OMNIVOY_BACKEND_PROXY_TARGET` if the backend is running on another address.

## Main features

- Flight search through Google Flights
- Ground transit and nearby restaurant search through Google Maps
- Hotel and stay search through Google Hotels
- Airbnb listing search through the backend's `/api/airbnb/search` route
- Destination recommendations through TripAdvisor
- AI trip planning, explanations and budget summaries through Gemini
- MySQL API request history and configurable response caching

See [backend setup and API notes](backend/travel-backend-py/README.md) and the files in `docs/` for more detail.
