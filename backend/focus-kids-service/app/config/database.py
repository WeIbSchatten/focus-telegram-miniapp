from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .settings import settings
from app.models.base import Base


engine = create_engine(settings.database_url_for_sqlalchemy, future=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

