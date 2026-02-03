from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    APP_DATABASE_URL: str
    APP_JWT_SECRET: str
    FOCUS_SERVICE_URL: str = "http://localhost:3001"
    # Доп. CORS-истоки (через запятую), например URL туннеля для Mini App
    CORS_ORIGINS_EXTRA: str = ""
    # Максимальный размер аудиофайла (байты). 5 МБ
    MAX_AUDIO_FILE_SIZE: int = 5 * 1024 * 1024
    # Директория для загруженных аудио (относительно рабочей директории)
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url_for_sqlalchemy(self) -> str:
        url = self.APP_DATABASE_URL
        if url.startswith("postgres://"):
            return "postgresql+psycopg2://" + url[len("postgres://"):]
        if url.startswith("postgresql://") and "+" not in url.split("://")[0]:
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    @property
    def upload_path(self) -> Path:
        return Path(self.UPLOAD_DIR).resolve()


settings = Settings()
