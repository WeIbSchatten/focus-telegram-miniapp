from typing import TYPE_CHECKING
from pydantic import BaseModel

if TYPE_CHECKING:
  from .lecture import LectureRead
  from .homework import HomeworkRead
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


class ProgramRead(ProgramBase):
  id: int
  lectures: list["LectureRead"] = []
  homeworks: list["HomeworkRead"] = []
  tests: list["TestRead"] = []

  class Config:
    from_attributes = True
