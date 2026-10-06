from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    serpapi_key: str
    redis_url: str | None = None          # empty -> in-memory cache
    monthly_quota: int = 90               # stay under your plan's limit (free-tier limit unverified)
    flights_ttl_minutes: int = 45         # a guess, tune after testing
    transit_ttl_minutes: int = 30         # a guess, tune after testing
    hotels_ttl_minutes: int = 60          # a guess, tune after testing
    serpapi_base_url: str = "https://serpapi.com"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]


def get_settings() -> Settings:
    return Settings()
