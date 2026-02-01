from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.lecture import Lecture
from app.models.program import Program
from app.models.student import Student
from app.schemas.lecture import LectureCreate, LectureRead, LectureUpdate
from app.services.telegram_notify import notify_students
from app.dependencies.roles import get_current_kids_role, require_teacher
from app.services.video_embed import parse_video_url

router = APIRouter(prefix="/lectures", tags=["lectures"])


def _apply_video(lecture: Lecture, video_type: str | None, video_id: str | None, video_url: str | None) -> None:
  if video_url:
    parsed_type, parsed_id = parse_video_url(video_url)
    if parsed_type and parsed_id:
      lecture.video_type = parsed_type
      lecture.video_id = parsed_id
      if parsed_type == "rutube":
        lecture.rutube_video_id = parsed_id
      return
  if video_type is not None:
    lecture.video_type = video_type
  if video_id is not None:
    lecture.video_id = video_id
    if (lecture.video_type or "rutube") == "rutube":
      lecture.rutube_video_id = video_id


@router.get("/", response_model=list[LectureRead])
@router.get("", response_model=list[LectureRead])
def list_lectures(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Lecture).all()


@router.get("/by-program/{program_id}", response_model=list[LectureRead])
def list_lectures_by_program(
  program_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Lecture).filter(Lecture.program_id == program_id).order_by(Lecture.order).all()


@router.post("/", response_model=LectureRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=LectureRead, status_code=status.HTTP_201_CREATED)
def create_lecture(
  payload: LectureCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  lecture = Lecture(
    program_id=payload.program_id,
    title=payload.title,
    description=payload.description,
    rutube_video_id=payload.rutube_video_id,
    video_type=payload.video_type or "rutube",
    video_id=payload.video_id,
    order=payload.order,
  )
  _apply_video(lecture, payload.video_type, payload.video_id, getattr(payload, "video_url", None))
  db.add(lecture)
  db.commit()
  db.refresh(lecture)
  program = db.query(Program).get(payload.program_id)
  if program:
    students = db.query(Student).filter(Student.group_id == program.group_id).all()
    focus_ids = [s.focus_user_id for s in students]
    notify_students(
      focus_ids,
      "new_video",
      {"program_name": program.name, "lecture_title": payload.title},
    )
  return lecture


@router.get("/{lecture_id}", response_model=LectureRead)
def get_lecture(
  lecture_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  lecture = db.query(Lecture).get(lecture_id)
  if not lecture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекция не найдена")
  return lecture


@router.get("/{lecture_id}/embed")
def get_lecture_embed(
  lecture_id: int,
  width: int = 720,
  height: int = 405,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  """Возвращает embed_url, watch_url и video_type для YouTube, VK, RuTube."""
  from app.services.video_embed import get_embed_url, get_watch_url

  lecture = db.query(Lecture).get(lecture_id)
  if not lecture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекция не найдена")

  video_type = lecture.video_type or "rutube"
  video_id = lecture.video_id or lecture.rutube_video_id
  if not video_id:
    return {"embed_url": None, "embed_html": None, "video_id": None, "video_type": video_type, "watch_url": None}

  embed_url = get_embed_url(video_type, video_id, width=width, height=height)
  watch_url = get_watch_url(video_type, video_id)
  embed_html = None
  if embed_url:
    embed_html = f'<iframe width="{width}" height="{height}" src="{embed_url}" frameBorder="0" allow="fullscreen" allowFullScreen></iframe>'
  elif video_type == "rutube":
    from app.services.rutube_service import get_embed_html as rutube_embed_html
    embed_html = rutube_embed_html(video_id, width=width, height=height)
    if not embed_url:
      from app.services.rutube_service import get_embed_url as rutube_embed_url
      embed_url = rutube_embed_url(video_id)
  return {
    "embed_url": embed_url,
    "embed_html": embed_html,
    "video_id": video_id,
    "video_type": video_type,
    "watch_url": watch_url,
  }


@router.patch("/{lecture_id}", response_model=LectureRead)
def update_lecture(
  lecture_id: int,
  payload: LectureUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  lecture = db.query(Lecture).get(lecture_id)
  if not lecture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекция не найдена")

  if payload.title is not None:
    lecture.title = payload.title
  if payload.description is not None:
    lecture.description = payload.description
  if payload.rutube_video_id is not None:
    lecture.rutube_video_id = payload.rutube_video_id
  if payload.order is not None:
    lecture.order = payload.order
  video_url = getattr(payload, "video_url", None)
  _apply_video(lecture, payload.video_type, payload.video_id, video_url)

  db.commit()
  db.refresh(lecture)
  return lecture


@router.delete("/{lecture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lecture(
  lecture_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  lecture = db.query(Lecture).get(lecture_id)
  if not lecture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лекция не найдена")
  db.delete(lecture)
  db.commit()
  return None
