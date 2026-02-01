from fastapi import FastAPI

from .config.settings import settings
from .routes import api_router
from .config.database import Base, engine

# Импортируем все модели для регистрации в SQLAlchemy
from .models import (  # noqa: F401
  student,
  teacher,
  group,
  attendance,
  grade,
  program,
  lecture,
  homework,
  test,
)


def create_app() -> FastAPI:
  app = FastAPI(
    title="Focus Kids Service",
    version="0.1.0",
  )

  # Создаём таблицы (для dev; в бою лучше использовать Alembic)
  Base.metadata.create_all(bind=engine)

  @app.get("/health", tags=["health"])
  async def health_check():
    return {"status": "ok", "service": "focus-kids", "env": settings.APP_ENV}

  app.include_router(api_router, prefix="/api")

  return app


app = create_app()

