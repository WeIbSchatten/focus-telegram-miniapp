from datetime import date

from pydantic import BaseModel


class AttendanceBase(BaseModel):
  student_id: int
  group_id: int
  lesson_date: date
  present: bool = True
  program_id: int | None = None  # тема/программа урока


class AttendanceCreate(AttendanceBase):
  pass


class AttendanceUpdate(BaseModel):
  present: bool | None = None
  program_id: int | None = None


class AttendanceRead(AttendanceBase):
  id: int
  program_id: int | None = None

  class Config:
    from_attributes = True

