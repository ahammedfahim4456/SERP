from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    serpapi_key: str
    redis_url: str | None = None          # empty -> in-memory cache
    monthly_quota: int = 90               # stay under your plan's limit (free-tier limit unverified)
    flights_ttl_minutes: int = 45         # a guess, tune after testing
    transit_ttl_minutes: int = 30         # a guess, tune after testing
    hotels_ttl_minutes: int = 60          # a guess, tune after testing
    food_ttl_minutes: int = 60            # a guess, tune after testing
    tripadvisor_ttl_minutes: int = 120    # TripAdvisor recommendations TTL
    gemini_api_key: str | None = None     # Google Gemini API Key from Google AI Studio
    gemini_model: str = "gemini-flash-lite-latest" # Default supported Gemini model with active quota
    serpapi_base_url: str = "https://serpapi.com"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


def get_settings() -> Settings:
    return Settings()
