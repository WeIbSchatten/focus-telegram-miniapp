from pydantic import BaseModel
from datetime import datetime


class MeditationRead(BaseModel):
    id: int
    title: str
    file_path: str
    file_size: int
    order: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class MeditationCreate(BaseModel):
    title: str


class MeditationUpdate(BaseModel):
    title: str | None = None
    order: int | None = None
