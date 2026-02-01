from pydantic import BaseModel


class StudentBase(BaseModel):
  full_name: str
  focus_user_id: str
  group_id: int | None = None


class StudentCreate(StudentBase):
  pass


class StudentUpdate(BaseModel):
  full_name: str | None = None
  group_id: int | None = None


class StudentRead(StudentBase):
  id: int

  class Config:
    from_attributes = True

