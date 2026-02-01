from pydantic import BaseModel


class HomeworkFileBase(BaseModel):
  file_url: str
  file_name: str


class HomeworkFileCreate(HomeworkFileBase):
  pass


class HomeworkFileRead(HomeworkFileBase):
  id: int

  class Config:
    from_attributes = True


class HomeworkBase(BaseModel):
  title: str
  description: str | None = None
  order: int = 0


class HomeworkCreate(HomeworkBase):
  program_id: int
  files: list[HomeworkFileCreate] = []


class HomeworkUpdate(BaseModel):
  title: str | None = None
  description: str | None = None
  order: int | None = None


class HomeworkRead(HomeworkBase):
  id: int
  program_id: int
  files: list[HomeworkFileRead] = []

  class Config:
    from_attributes = True


class HomeworkSubmissionFileBase(BaseModel):
  file_url: str
  file_name: str


class HomeworkSubmissionFileCreate(HomeworkSubmissionFileBase):
  pass


class HomeworkSubmissionFileRead(HomeworkSubmissionFileBase):
  id: int

  class Config:
    from_attributes = True


class HomeworkCommentBase(BaseModel):
  comment_text: str


class HomeworkCommentCreate(HomeworkCommentBase):
  author_id: int


class HomeworkCommentRead(HomeworkCommentBase):
  id: int
  submission_id: int
  author_id: int

  class Config:
    from_attributes = True


class HomeworkSubmissionBase(BaseModel):
  answer_text: str | None = None


class HomeworkSubmissionCreate(HomeworkSubmissionBase):
  homework_id: int
  student_id: int
  files: list[HomeworkSubmissionFileCreate] = []


class HomeworkSubmissionUpdate(BaseModel):
  answer_text: str | None = None
  grade: int | None = None
  teacher_comment: str | None = None


class HomeworkSubmissionRead(HomeworkSubmissionBase):
  id: int
  homework_id: int
  student_id: int
  grade: int | None = None
  teacher_comment: str | None = None
  files: list[HomeworkSubmissionFileRead] = []
  comments: list[HomeworkCommentRead] = []

  class Config:
    from_attributes = True
