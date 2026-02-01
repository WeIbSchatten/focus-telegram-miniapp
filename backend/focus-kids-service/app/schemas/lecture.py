from pydantic import BaseModel


class LectureBase(BaseModel):
  title: str
  description: str | None = None
  rutube_video_id: str | None = None
  order: int = 0


class LectureCreate(LectureBase):
  program_id: int


class LectureUpdate(BaseModel):
  title: str | None = None
  description: str | None = None
  rutube_video_id: str | None = None
  order: int | None = None


class LectureRead(LectureBase):
  id: int
  program_id: int

  class Config:
    from_attributes = True
