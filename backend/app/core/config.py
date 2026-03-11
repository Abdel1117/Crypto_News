from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENV: str = "development"
    PORT_BACK: int = 4000
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""
    DB_PORT: int = 5432
    API_KEY_COINGECKO: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
