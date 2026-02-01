import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

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


def wait_for_db_and_create_tables(max_attempts: int = 30, delay_seconds: float = 1.0) -> None:
  """Ждёт готовности БД (например, после docker-compose up) и создаёт таблицы."""
  for attempt in range(1, max_attempts + 1):
    try:
      Base.metadata.create_all(bind=engine)
      return
    except OperationalError as e:
      msg = str(getattr(e, "orig", e))
      if "starting up" in msg.lower() or "connection" in msg.lower():
        if attempt == max_attempts:
          raise RuntimeError(f"Database not ready after {max_attempts} attempts") from e
        time.sleep(delay_seconds)
      else:
        raise


def create_app() -> FastAPI:
  app = FastAPI(
    title="Focus Kids Service",
    version="0.1.0",
    redirect_slashes=False,  # иначе 307/308 отдают Location на внутренний хост — браузер за ним не достучится через прокси
  )

  # Явные origins: при allow_credentials=True браузер не принимает "*"
  cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
  ]
  if settings.CORS_ORIGINS_EXTRA:
    cors_origins = [*cors_origins, *(o.strip() for o in settings.CORS_ORIGINS_EXTRA.split(",") if o.strip())]
  app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
  )

  # Ждём готовности БД и создаём таблицы (для dev; в бою лучше Alembic)
  wait_for_db_and_create_tables()

  @app.get("/health", tags=["health"])
  async def health_check():
    return {"status": "ok", "service": "focus-kids", "env": settings.APP_ENV}

  app.include_router(api_router, prefix="/api")

  @app.exception_handler(OperationalError)
  async def db_operational_error_handler(request, exc: OperationalError):
    msg = str(getattr(exc, "orig", exc))
    if "lesson_date" in msg or "column" in msg.lower():
      return JSONResponse(
        status_code=500,
        content={
          "detail": "Требуется миграция БД. Выполните: database/init-scripts/02-grades-lesson-date.sql (ALTER TABLE grades ADD COLUMN IF NOT EXISTS lesson_date DATE; ALTER TABLE grades ALTER COLUMN comment TYPE VARCHAR(500);)"
        },
      )
    return JSONResponse(status_code=500, content={"detail": f"Database error: {msg}"})

  @app.exception_handler(Exception)
  async def unhandled_exception_handler(request, exc: Exception):
    return JSONResponse(
      status_code=500,
      content={"detail": str(exc) or "Internal server error"},
    )

  return app


app = create_app()

