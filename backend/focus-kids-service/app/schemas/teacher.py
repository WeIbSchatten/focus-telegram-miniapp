from pydantic import BaseModel


class TeacherBase(BaseModel):
  full_name: str
  focus_user_id: str


class TeacherCreate(TeacherBase):
  pass


class TeacherUpdate(BaseModel):
  full_name: str | None = None


class TeacherRead(TeacherBase):
  id: int

  class Config:
    from_attributes = True

