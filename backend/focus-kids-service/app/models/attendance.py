from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Attendance(Base):
  __tablename__ = "attendance"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
  group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
  lesson_date: Mapped[date] = mapped_column(Date)
  present: Mapped[bool] = mapped_column(Boolean, default=True)
  program_id: Mapped[int | None] = mapped_column(ForeignKey("programs.id"), nullable=True)  # тема/программа урока

  student: Mapped["Student"] = relationship()
  group: Mapped["Group"] = relationship()

