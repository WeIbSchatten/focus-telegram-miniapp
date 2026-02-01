from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Teacher(Base):
  __tablename__ = "teachers"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  focus_user_id: Mapped[str] = mapped_column(String, index=True)
  full_name: Mapped[str] = mapped_column(String(100))

  groups: Mapped[list["Group"]] = relationship(back_populates="teacher")

