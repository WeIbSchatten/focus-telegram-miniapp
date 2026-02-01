from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.lecture import Lecture
from app.schemas.lecture import LectureCreate, LectureRead, LectureUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/lectures", tags=["lectures"])


@router.get("/", response_model=list[LectureRead])
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
    order=payload.order,
  )
  db.add(lecture)
  db.commit()
  db.refresh(lecture)
  return lecture


@router.get("/{lecture_id}", response_model=LectureRead)
def get_lecture(
  lecture_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  lecture = db.query(Lecture).get(lecture_id)
  if not lecture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
  return lecture


@router.get("/{lecture_id}/embed")
def get_lecture_embed(
  lecture_id: int,
  width: int = 720,
  height: int = 405,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  """Возвращает embed URL и HTML для встраивания RuTube плеера."""
  lecture = db.query(Lecture).get(lecture_id)
  if not lecture:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
  if not lecture.rutube_video_id:
    return {"embed_url": None, "embed_html": None, "video_id": None}

  from app.services.rutube_service import get_embed_url, get_embed_html

  embed_url = get_embed_url(lecture.rutube_video_id)
  embed_html = get_embed_html(lecture.rutube_video_id, width=width, height=height)
  return {
    "embed_url": embed_url,
    "embed_html": embed_html,
    "video_id": lecture.rutube_video_id,
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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")

  if payload.title is not None:
    lecture.title = payload.title
  if payload.description is not None:
    lecture.description = payload.description
  if payload.rutube_video_id is not None:
    lecture.rutube_video_id = payload.rutube_video_id
  if payload.order is not None:
    lecture.order = payload.order

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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
  db.delete(lecture)
  db.commit()
  return None
