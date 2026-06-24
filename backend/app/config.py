from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://robosim:robosim@localhost:5432/robosim"
    cors_origins: str = "http://localhost:8080,http://localhost:5173"


settings = Settings()
