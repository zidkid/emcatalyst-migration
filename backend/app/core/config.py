from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql://emcatalyst:emcatalyst123@localhost:5432/emcatalyst_db"
    SECRET_KEY: str = "change-this-secret-key-in-production-must-be-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    FIRST_SUPERUSER: str = "admin@emcure.com"
    FIRST_SUPERUSER_PASSWORD: str = "Admin@123"
    APP_NAME: str = "EMCatalyst"
    # SMTP Email Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@emcure.com"
    FRONTEND_URL: str = "http://localhost:5173"


settings = Settings()
