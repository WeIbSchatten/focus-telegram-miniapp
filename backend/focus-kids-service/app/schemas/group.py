from pydantic import BaseModel

from .teacher import TeacherRead
from .student import StudentRead


class GroupBase(BaseModel):
  name: str
  level: str | None = None
  teacher_id: int | None = None


class GroupCreate(GroupBase):
  pass


class GroupUpdate(BaseModel):
  name: str | None = None
  level: str | None = None
  teacher_id: int | None = None


class GroupRead(GroupBase):
  id: int
  teacher: TeacherRead | None = None
  students: list[StudentRead] = []

  class Config:
    from_attributes = True

