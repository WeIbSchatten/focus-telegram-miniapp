from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  APP_ENV: str = "development"
  APP_PORT: int = 8000
  APP_DATABASE_URL: str
  APP_JWT_SECRET: str
  FOCUS_SERVICE_URL: str = "http://localhost:3001"

  class Config:
    env_file = ".env"
    env_file_encoding = "utf-8"


settings = Settings()

