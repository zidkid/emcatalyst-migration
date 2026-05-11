from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://emcatalyst:emcatalyst123@localhost:5432/emcatalyst_db"
    SECRET_KEY: str = "change-this-secret-key-in-production-must-be-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    FIRST_SUPERUSER: str = "admin@emcure.com"
    FIRST_SUPERUSER_PASSWORD: str = "Admin@123"
    APP_NAME: str = "EMCatalyst"

    class Config:
        env_file = ".env"


settings = Settings()
