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

    JWT_SECRET_KEY:  str = ""
    JWT_ALGORITHM:  str = ""
    JWT_EXPIRATION_HOURS : str = ""
    JWT_REFRESH_EXPIRATION_DAYS : str = ""
    ACCESS_TOKEN_EXPIRE_DELTA:  str = ""
    REFRESH_TOKEN_EXPIRE_DELTA:  str = ""
    TOKEN_TYPE_ACCESS:  str = ""
    TOKEN_TYPE_REFRESH:  str = ""
    
    model_config = {"env_file": ".env"}


settings = Settings()
