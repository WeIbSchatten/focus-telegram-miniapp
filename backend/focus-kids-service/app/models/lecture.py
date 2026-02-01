from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Lecture(Base):
  __tablename__ = "lectures"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
  title: Mapped[str] = mapped_column(String(200))
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  rutube_video_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # legacy
  video_type: Mapped[str] = mapped_column(String(20), default="rutube")  # youtube, vk, rutube
  video_id: Mapped[str | None] = mapped_column(String(200), nullable=True)  # id или embed-ид из ссылки
  order: Mapped[int] = mapped_column(default=0)

  program: Mapped["Program"] = relationship(back_populates="lectures")
