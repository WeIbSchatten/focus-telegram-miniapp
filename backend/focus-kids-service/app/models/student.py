from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Student(Base):
  __tablename__ = "students"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  focus_user_id: Mapped[str] = mapped_column(String, index=True)
  full_name: Mapped[str] = mapped_column(String(100))

  group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"))
  group: Mapped["Group"] = relationship(back_populates="students")

