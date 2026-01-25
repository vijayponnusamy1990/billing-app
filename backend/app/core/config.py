from typing import Union
from pydantic import AnyUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "BillingApp"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "CHANGE_ME_SUPER_SECRET"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    SQLALCHEMY_DATABASE_URI: Union[AnyUrl, str] = "sqlite:///./billing.db"

    class Config:
        env_file = ".env"

settings = Settings()
