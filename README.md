# SerpApi True Trip Comparator

A full-stack travel comparison tool powered by **SerpApi**, **Google Flights**, **Airbnb**, and **TripAdvisor** engines. Compare flights, hotels, transit, food, and events across destinations — all from one dashboard.

---

## 📂 Project Structure

```
serp-api/
├── frontend/           # React + Vite frontend (UI)
│   ├── src/
│   │   ├── components/ # All React UI components
│   │   ├── services/   # API calls to backend
│   │   ├── data/       # Mock/static data
│   │   ├── App.jsx     # Main application component
│   │   ├── main.jsx    # Entry point
│   │   └── index.css   # Global styles
│   ├── index.html      # HTML entry point
│   ├── package.json    # Frontend dependencies
│   ├── vite.config.js  # Vite dev server config (proxies /api → backend)
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/            # Python FastAPI backend
│   └── travel-backend-py/
│       ├── app/
│       │   ├── main.py          # FastAPI app entry
│       │   ├── routes.py        # API route definitions
│       │   ├── config.py        # Environment settings
│       │   ├── serpapi_client.py # SerpApi HTTP client
│       │   ├── flights.py       # Flight search logic
│       │   ├── hotels.py        # Hotel search (Google + Airbnb)
│       │   ├── transit.py       # Transit/bus/train search
│       │   ├── food.py          # Restaurant search
│       │   ├── tripadvisor.py   # TripAdvisor recommendations
│       │   ├── cache.py         # In-memory caching
│       │   └── quota.py         # API usage tracking
│       ├── scripts/             # Utility/probe scripts
│       ├── tests/               # Backend tests
│       ├── requirements.txt     # Python dependencies
│       └── .env                 # API keys (not committed)
│
└── docs/               # Documentation & architecture
    ├── complete.md
    ├── SerpApi_Analysis_Report.docx
    ├── Travel_Assistant_Architecture.docx
    └── user arcchitechture.jpeg
```

---

## 🚀 How to Run

### Backend (Python FastAPI)

```bash
cd backend/travel-backend-py
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Create .env with your SerpApi key:
# SERPAPI_KEY=your_key_here

uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:3000` and proxies all `/api/*` requests to the backend at `http://localhost:8000`.

---

## 🔑 API Engines Used

| Engine | Purpose |
|--------|---------|
| **Google Flights** | Round-trip flight comparison |
| **Google Maps Transit** | Bus, train, metro directions |
| **Google Hotels** | Hotel search & pricing |
| **Airbnb (via SerpApi)** | Vacation rentals, homes |
| **TripAdvisor (via SerpApi)** | Budget-based recommendations |
| **Google Maps Local** | Nearby restaurants & food |
| **Google Events** | Local events & activities |
