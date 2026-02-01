from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  APP_ENV: str = "development"
  APP_PORT: int = 8000
  APP_DATABASE_URL: str
  APP_JWT_SECRET: str
  FOCUS_SERVICE_URL: str = "http://localhost:3001"
  TELEGRAM_BOT_NOTIFY_URL: str = ""
  TELEGRAM_BOT_NOTIFY_SECRET: str = ""
  # Доп. CORS-истоки (через запятую), например URL туннеля для Mini App
  CORS_ORIGINS_EXTRA: str = ""

  class Config:
    env_file = ".env"
    env_file_encoding = "utf-8"

  @property
  def database_url_for_sqlalchemy(self) -> str:
    """Use postgresql:// so SQLAlchemy loads psycopg2 dialect (postgres:// is deprecated)."""
    url = self.APP_DATABASE_URL
    if url.startswith("postgres://"):
      return "postgresql+psycopg2://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+" not in url.split("://")[0]:
      return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


settings = Settings()

