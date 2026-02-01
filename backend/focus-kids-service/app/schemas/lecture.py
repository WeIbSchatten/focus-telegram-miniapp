from pydantic import BaseModel


class LectureBase(BaseModel):
  title: str
  description: str | None = None
  rutube_video_id: str | None = None
  video_type: str = "rutube"  # youtube, vk, rutube
  video_id: str | None = None
  order: int = 0


class LectureCreate(LectureBase):
  program_id: int
  video_url: str | None = None  # при указании парсится в video_type + video_id


class LectureUpdate(BaseModel):
  title: str | None = None
  description: str | None = None
  rutube_video_id: str | None = None
  video_type: str | None = None
  video_id: str | None = None
  video_url: str | None = None
  order: int | None = None


class LectureRead(LectureBase):
  id: int
  program_id: int
  video_type: str = "rutube"
  video_id: str | None = None

  class Config:
    from_attributes = True
