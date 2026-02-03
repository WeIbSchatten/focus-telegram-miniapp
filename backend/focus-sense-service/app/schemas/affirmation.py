from pydantic import BaseModel
from datetime import datetime


class AffirmationRead(BaseModel):
    id: int
    title: str
    file_path: str
    file_size: int
    order: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class AffirmationCreate(BaseModel):
    title: str


class AffirmationUpdate(BaseModel):
    title: str | None = None
    order: int | None = None
