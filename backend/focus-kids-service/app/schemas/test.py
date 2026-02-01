from pydantic import BaseModel


class TestAnswerBase(BaseModel):
  answer_text: str
  is_correct: bool = False
  order: int = 0


class TestAnswerCreate(TestAnswerBase):
  pass


class TestAnswerRead(TestAnswerBase):
  id: int
  question_id: int

  class Config:
    from_attributes = True


class TestQuestionBase(BaseModel):
  question_text: str
  question_type: str
  order: int = 0


class TestQuestionCreate(TestQuestionBase):
  answers: list[TestAnswerCreate] = []


class TestQuestionRead(TestQuestionBase):
  id: int
  test_id: int
  answers: list[TestAnswerRead] = []

  class Config:
    from_attributes = True


class TestBase(BaseModel):
  title: str
  description: str | None = None
  order: int = 0


class TestCreate(TestBase):
  program_id: int
  questions: list[TestQuestionCreate] = []


class TestUpdate(BaseModel):
  title: str | None = None
  description: str | None = None
  order: int | None = None


class TestRead(TestBase):
  id: int
  program_id: int
  questions: list[TestQuestionRead] = []

  class Config:
    from_attributes = True


class TestSubmissionAnswerBase(BaseModel):
  answer_text: str | None = None
  selected_answer_ids: str | None = None


class TestSubmissionAnswerCreate(TestSubmissionAnswerBase):
  question_id: int


class TestSubmissionAnswerRead(TestSubmissionAnswerBase):
  id: int
  submission_id: int
  question_id: int

  class Config:
    from_attributes = True


class TestSubmissionBase(BaseModel):
  pass


class TestSubmissionCreate(TestSubmissionBase):
  test_id: int
  student_id: int
  answers: list[TestSubmissionAnswerCreate] = []


class TestSubmissionUpdate(BaseModel):
  is_approved_for_retake: bool | None = None


class TestSubmissionRead(TestSubmissionBase):
  id: int
  test_id: int
  student_id: int
  score: int | None = None
  max_score: int | None = None
  is_approved_for_retake: bool = False
  answers: list[TestSubmissionAnswerRead] = []

  class Config:
    from_attributes = True
