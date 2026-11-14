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
    # Sender shown on emails, e.g. "Crypto-Explorer <alertes@example.com>".
    # Defaults to SMTP_USER; needed when the SMTP login isn't an address.
    SMTP_FROM: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"
    # Public URL of the site, for the links in emails. Defaults to the first
    # CORS origin, which is the site itself.
    APP_PUBLIC_URL: str = ""

    # How often (seconds) the daily value of every simulated portfolio is
    # recorded; 0 turns the background task off.
    SIM_SNAPSHOT_INTERVAL: int = 3600

    # Where uploaded files (blog cover images) are kept. In Docker it is a
    # volume, shared with nginx in production.
    MEDIA_DIR: str = "media"
    # How often (seconds) price alerts are checked; 0 turns the background task
    # off. Each check costs one CoinGecko call per 250 coins watched: at 600 s,
    # about 4,300 calls a month out of the Demo plan's 10,000.
    PRICE_ALERT_INTERVAL: int = 600

    ANTHROPIC_API_KEY: str = ""
    CHAT_MODEL: str = "claude-haiku-5-5"
    CHAT_DAILY_LIMIT: int = 30
    CHAT_MAX_HISTORY: int = 20

    model_config = {"extra": "ignore"}

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def EMAIL_ENABLED(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_USER)

    @property
    def PUBLIC_URL(self) -> str:
        origins = self.CORS_ORIGINS_LIST
        url = self.APP_PUBLIC_URL or (origins[0] if origins else "http://localhost:3000")
        return url.rstrip("/")


settings = Settings()
