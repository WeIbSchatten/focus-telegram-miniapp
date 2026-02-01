from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Grade(Base):
  __tablename__ = "grades"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
  group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
  value: Mapped[int] = mapped_column(Integer)
  type: Mapped[str] = mapped_column(String(50))  # e.g. homework, test, classwork
  comment: Mapped[str | None] = mapped_column(String(255), nullable=True)

  student: Mapped["Student"] = relationship()
  group: Mapped["Group"] = relationship()

