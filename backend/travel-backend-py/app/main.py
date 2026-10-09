import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .ai import AiService
from .airbnb import AirbnbService
from .cache import build_cache
from .config import get_settings
from .flights import FlightService
from .food import FoodService
from .hotels import HotelService
from .transit import TransitService
from .tripadvisor import TripadvisorService
from .quota import QuotaExceeded, QuotaGuard
from .routes import router
from .serpapi_client import SerpApiClient, UpstreamError
from .query_store import QueryStore
from .query_logging import QueryLoggingMiddleware

logging.basicConfig(level=logging.INFO)
# HTTPX logs full request URLs at INFO, which can expose provider keys passed in query strings.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
query_store = QueryStore.from_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    query_store.settings = settings
    await query_store.initialize()
    app.state.query_store = query_store
    cache = await build_cache(settings.redis_url)
    http = httpx.AsyncClient(base_url=settings.serpapi_base_url, timeout=30)
    quota = QuotaGuard(cache, settings.monthly_quota)
    app.state.quota = quota
    app.state.flights = FlightService(
        SerpApiClient(http, settings.serpapi_key), cache, quota, settings.flights_ttl_minutes * 60)
    app.state.transit = TransitService(
        SerpApiClient(http, settings.serpapi_key), cache, quota, settings.transit_ttl_minutes * 60)
    app.state.hotels = HotelService(
        SerpApiClient(http, settings.serpapi_key), cache, quota, settings.hotels_ttl_minutes * 60)
    app.state.airbnb = AirbnbService(
        SerpApiClient(http, settings.serpapi_key), cache, quota, settings.airbnb_ttl_minutes * 60)
    app.state.food = FoodService(
        SerpApiClient(http, settings.serpapi_key), cache, quota, settings.food_ttl_minutes * 60)
    app.state.tripadvisor = TripadvisorService(
        SerpApiClient(http, settings.serpapi_key), cache, quota, settings.tripadvisor_ttl_minutes * 60)
    app.state.ai = AiService(settings.gemini_api_key, settings.gemini_model)
    yield
    await http.aclose()
    await cache.close()
    await query_store.close()


app = FastAPI(title="Travel Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(router)
app.add_middleware(QueryLoggingMiddleware, store=query_store)


@app.exception_handler(ValueError)
async def bad_input(_: Request, exc: ValueError):
    return JSONResponse({"detail": str(exc)}, status_code=400)


@app.exception_handler(QuotaExceeded)
async def quota_exceeded(_: Request, exc: QuotaExceeded):
    return JSONResponse({"detail": str(exc)}, status_code=429)


@app.exception_handler(UpstreamError)
async def upstream_failed(_: Request, exc: UpstreamError):
    logging.getLogger("upstream").warning("%s", exc)      # visible in the server terminal
    return JSONResponse({"detail": str(exc)}, status_code=502)
