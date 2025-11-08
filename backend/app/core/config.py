import json
from pathlib import Path
from typing import List, Sequence

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the backend directory (where .env should be)
# config.py is in app/core/, so go up 2 levels to get to backend/
BACKEND_DIR = Path(__file__).parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "stirixi_ai_atl"
    
    # FastAPI
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Environment
    ENVIRONMENT: str = "development"
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,  # Only use .env if it exists
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Sequence[str] | str) -> Sequence[str]:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                try:
                    parsed = json.loads(value)
                except json.JSONDecodeError as exc:
                    raise ValueError("CORS_ORIGINS must be a JSON array or comma separated list") from exc
                return parsed
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()

# Debug: Print loaded settings (without sensitive data)
if settings.ENVIRONMENT == "development":
    print(f"📋 Configuration:")
    print(f"   .env file path: {ENV_FILE}")
    print(f"   .env file exists: {ENV_FILE.exists()}")
    if ENV_FILE.exists():
        print(f"   ✅ Loading from: {ENV_FILE}")
    else:
        print(f"   ⚠️  .env file not found, using defaults")
    print(f"   MONGODB_URL: {settings.MONGODB_URL[:50]}..." if len(settings.MONGODB_URL) > 50 else f"   MONGODB_URL: {settings.MONGODB_URL}")
    print(f"   MONGODB_DB_NAME: {settings.MONGODB_DB_NAME}")
    print(f"   API_PORT: {settings.API_PORT}")
