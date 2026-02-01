from sqlalchemy import String, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Test(Base):
  __tablename__ = "tests"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
  title: Mapped[str] = mapped_column(String(200))
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  order: Mapped[int] = mapped_column(default=0)

  program: Mapped["Program"] = relationship(back_populates="tests")
  questions: Mapped[list["TestQuestion"]] = relationship(back_populates="test", cascade="all, delete-orphan")
  submissions: Mapped[list["TestSubmission"]] = relationship(back_populates="test", cascade="all, delete-orphan")


class TestQuestion(Base):
  __tablename__ = "test_questions"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  test_id: Mapped[int] = mapped_column(ForeignKey("tests.id"))
  question_text: Mapped[str] = mapped_column(Text)
  question_type: Mapped[str] = mapped_column(String(50))  # single_choice, multiple_choice, text
  order: Mapped[int] = mapped_column(default=0)

  test: Mapped["Test"] = relationship(back_populates="questions")
  answers: Mapped[list["TestAnswer"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class TestAnswer(Base):
  __tablename__ = "test_answers"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  question_id: Mapped[int] = mapped_column(ForeignKey("test_questions.id"))
  answer_text: Mapped[str] = mapped_column(Text)
  is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
  order: Mapped[int] = mapped_column(default=0)

  question: Mapped["TestQuestion"] = relationship(back_populates="answers")


class TestSubmission(Base):
  __tablename__ = "test_submissions"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  test_id: Mapped[int] = mapped_column(ForeignKey("tests.id"))
  student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
  score: Mapped[int | None] = mapped_column(Integer, nullable=True)
  max_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
  is_approved_for_retake: Mapped[bool] = mapped_column(Boolean, default=False)

  test: Mapped["Test"] = relationship(back_populates="submissions")
  student: Mapped["Student"] = relationship()
  answers: Mapped[list["TestSubmissionAnswer"]] = relationship(back_populates="submission", cascade="all, delete-orphan")


class TestSubmissionAnswer(Base):
  __tablename__ = "test_submission_answers"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  submission_id: Mapped[int] = mapped_column(ForeignKey("test_submissions.id"))
  question_id: Mapped[int] = mapped_column(ForeignKey("test_questions.id"))
  answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
  selected_answer_ids: Mapped[str | None] = mapped_column(String(500), nullable=True)  # JSON array of answer IDs

  submission: Mapped["TestSubmission"] = relationship(back_populates="answers")
  question: Mapped["TestQuestion"] = relationship()
