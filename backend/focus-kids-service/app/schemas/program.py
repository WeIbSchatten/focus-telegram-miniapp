from pydantic import BaseModel

from .homework import HomeworkRead
from .lecture import LectureRead
from .test import TestRead


class ProgramBase(BaseModel):
  name: str
  description: str | None = None
  group_id: int


class ProgramCreate(ProgramBase):
  pass


class ProgramUpdate(BaseModel):
  name: str | None = None
  description: str | None = None


class ProgramListRead(ProgramBase):
  """Lightweight program for list endpoints; no nested relations."""
  id: int

  class Config:
    from_attributes = True


class ProgramListWithCountsRead(ProgramListRead):
  """Program list item with counts for learning page (no N+1 full loads)."""
  lectures_count: int = 0
  homeworks_count: int = 0
  tests_count: int = 0
  lessons_count: int = 0  # проведённых занятий по этой программе (attendance с program_id)


class ProgramRead(ProgramBase):
  id: int
  lectures: list[LectureRead] = []
  homeworks: list[HomeworkRead] = []
  tests: list[TestRead] = []

  class Config:
    from_attributes = True
