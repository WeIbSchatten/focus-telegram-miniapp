from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Program(Base):
  __tablename__ = "programs"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
  name: Mapped[str] = mapped_column(String(200))
  description: Mapped[str | None] = mapped_column(Text, nullable=True)

  group: Mapped["Group"] = relationship(back_populates="programs")
  lectures: Mapped[list["Lecture"]] = relationship(back_populates="program", cascade="all, delete-orphan")
  homeworks: Mapped[list["Homework"]] = relationship(back_populates="program", cascade="all, delete-orphan")
  tests: Mapped[list["Test"]] = relationship(back_populates="program", cascade="all, delete-orphan")
