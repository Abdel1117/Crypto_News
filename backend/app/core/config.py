from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENV: str = "development"
    PORT_BACK: int = 4000
    DB_HOST: str = "localhost"
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""
    DB_PORT: int = 5432
    API_KEY_COINGECKO: str = ""
    GOOGLE_CLIENT_ID : str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_RECIPIENT: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = {"extra": "ignore"}

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
