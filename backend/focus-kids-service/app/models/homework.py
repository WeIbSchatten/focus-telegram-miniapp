from sqlalchemy import String, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Homework(Base):
  __tablename__ = "homeworks"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
  title: Mapped[str] = mapped_column(String(200))
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  order: Mapped[int] = mapped_column(default=0)

  program: Mapped["Program"] = relationship(back_populates="homeworks")
  files: Mapped[list["HomeworkFile"]] = relationship(back_populates="homework", cascade="all, delete-orphan")
  submissions: Mapped[list["HomeworkSubmission"]] = relationship(back_populates="homework", cascade="all, delete-orphan")


class HomeworkFile(Base):
  __tablename__ = "homework_files"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  homework_id: Mapped[int] = mapped_column(ForeignKey("homeworks.id"))
  file_url: Mapped[str] = mapped_column(String(500))
  file_name: Mapped[str] = mapped_column(String(255))

  homework: Mapped["Homework"] = relationship(back_populates="files")


class HomeworkSubmission(Base):
  __tablename__ = "homework_submissions"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  homework_id: Mapped[int] = mapped_column(ForeignKey("homeworks.id"))
  student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
  answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
  grade: Mapped[int | None] = mapped_column(nullable=True)
  teacher_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

  homework: Mapped["Homework"] = relationship(back_populates="submissions")
  student: Mapped["Student"] = relationship()
  files: Mapped[list["HomeworkSubmissionFile"]] = relationship(back_populates="submission", cascade="all, delete-orphan")
  comments: Mapped[list["HomeworkComment"]] = relationship(back_populates="submission", cascade="all, delete-orphan")


class HomeworkSubmissionFile(Base):
  __tablename__ = "homework_submission_files"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  submission_id: Mapped[int] = mapped_column(ForeignKey("homework_submissions.id"))
  file_url: Mapped[str] = mapped_column(String(500))
  file_name: Mapped[str] = mapped_column(String(255))

  submission: Mapped["HomeworkSubmission"] = relationship(back_populates="files")


class HomeworkComment(Base):
  __tablename__ = "homework_comments"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  submission_id: Mapped[int] = mapped_column(ForeignKey("homework_submissions.id"))
  author_id: Mapped[int] = mapped_column(ForeignKey("students.id"))  # или teacher_id, упрощённо
  comment_text: Mapped[str] = mapped_column(Text)

  submission: Mapped["HomeworkSubmission"] = relationship(back_populates="comments")
