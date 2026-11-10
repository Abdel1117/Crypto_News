from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENV: str = "development"
    PORT_BACK: int = 4000
    DB_HOST: str = "localhost"
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""
    DB_PORT: int = 5432
    # Optional full URL; overrides DB_* and the local SQLite default.
    DATABASE_URL: str = ""
    API_KEY_COINGECKO: str = ""
    GOOGLE_CLIENT_ID : str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_RECIPIENT: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    # How often (seconds) the daily value of every simulated portfolio is
    # recorded; 0 turns the background task off.
    SIM_SNAPSHOT_INTERVAL: int = 3600

    # Where uploaded files (blog cover images) are kept. In Docker it is a
    # volume, shared with nginx in production.
    MEDIA_DIR: str = "media"

    model_config = {"extra": "ignore"}

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
