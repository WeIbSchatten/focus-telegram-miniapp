from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Group(Base):
  __tablename__ = "groups"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  name: Mapped[str] = mapped_column(String(100))
  level: Mapped[str | None] = mapped_column(String(50), nullable=True)

  teacher_id: Mapped[int | None] = mapped_column(ForeignKey("teachers.id"))
  teacher: Mapped["Teacher"] = relationship(back_populates="groups")

  students: Mapped[list["Student"]] = relationship(back_populates="group")
  programs: Mapped[list["Program"]] = relationship(back_populates="group")

