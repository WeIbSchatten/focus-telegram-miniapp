from datetime import date

from sqlalchemy import String, Integer, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Grade(Base):
  __tablename__ = "grades"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
  group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
  lesson_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # привязка к дате занятия
  value: Mapped[int] = mapped_column(Integer)
  type: Mapped[str] = mapped_column(String(50))  # oral_hw, written_hw, dictation, classwork, homework_next
  comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
  program_id: Mapped[int | None] = mapped_column(ForeignKey("programs.id"), nullable=True)  # тема/программа урока

  student: Mapped["Student"] = relationship()
  group: Mapped["Group"] = relationship()

