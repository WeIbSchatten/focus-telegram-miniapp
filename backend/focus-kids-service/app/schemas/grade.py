from pydantic import BaseModel


class GradeBase(BaseModel):
  student_id: int
  group_id: int
  value: int
  type: str
  comment: str | None = None


class GradeCreate(GradeBase):
  pass


class GradeUpdate(BaseModel):
  value: int | None = None
  type: str | None = None
  comment: str | None = None


class GradeRead(GradeBase):
  id: int

  class Config:
    from_attributes = True

