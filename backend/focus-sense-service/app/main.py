import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.config.settings import settings
from app.config.database import Base, engine
from app.routes import api_router

from app.models import (
    Meditation,
    Affirmation,
    WeeklyIntention,
    DailyQuestion,
)


def wait_for_db_and_create_tables(max_attempts: int = 30, delay_seconds: float = 1.0) -> None:
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
        title="Focus Sense Service",
        version="0.1.0",
        redirect_slashes=False,
    )

    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",
        "https://127.0.0.1:3000",
    ]
    if settings.CORS_ORIGINS_EXTRA:
        cors_origins = [
            *cors_origins,
            *(o.strip() for o in settings.CORS_ORIGINS_EXTRA.split(",") if o.strip()),
        ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    settings.upload_path.mkdir(parents=True, exist_ok=True)
    (settings.upload_path / "meditations").mkdir(exist_ok=True)
    (settings.upload_path / "affirmations").mkdir(exist_ok=True)

    wait_for_db_and_create_tables()

    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "service": "focus-sense", "env": settings.APP_ENV}

    app.include_router(api_router, prefix="/api")

    @app.exception_handler(OperationalError)
    async def db_error(request, exc: OperationalError):
        return JSONResponse(
            status_code=500,
            content={"detail": str(getattr(exc, "orig", exc))},
        )

    return app


app = create_app()
