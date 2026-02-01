from datetime import date

from pydantic import BaseModel


class AttendanceBase(BaseModel):
  student_id: int
  group_id: int
  lesson_date: date
  present: bool = True


class AttendanceCreate(AttendanceBase):
  pass


class AttendanceUpdate(BaseModel):
  present: bool | None = None


class AttendanceRead(AttendanceBase):
  id: int

  class Config:
    from_attributes = True

