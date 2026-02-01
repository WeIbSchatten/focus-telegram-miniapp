from datetime import date

from pydantic import BaseModel


class GradeBase(BaseModel):
  student_id: int
  group_id: int
  lesson_date: date | None = None
  value: int
  type: str
  comment: str | None = None
  program_id: int | None = None  # тема/программа урока


class GradeCreate(GradeBase):
  pass


class GradeUpdate(BaseModel):
  lesson_date: date | None = None
  value: int | None = None
  type: str | None = None
  comment: str | None = None
  program_id: int | None = None


class GradeRead(GradeBase):
  id: int
  program_id: int | None = None

  class Config:
    from_attributes = True

