from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate, TeacherRead, TeacherUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher
from app.services.focus_client import focus_user_exists_sync

router = APIRouter(prefix="/teachers", tags=["teachers"])


def _get_bearer_token(request: Request) -> str | None:
  auth = request.headers.get("Authorization")
  return auth[7:] if auth and auth.startswith("Bearer ") else None


@router.get("/", response_model=list[TeacherRead])
def list_teachers(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Teacher).all()


@router.post("/", response_model=TeacherRead, status_code=status.HTTP_201_CREATED)
def create_teacher(
  payload: TeacherCreate,
  request: Request,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  result = focus_user_exists_sync(payload.focus_user_id, _get_bearer_token(request))
  if result == "not_found":
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="focus_user_id not found in Focus service",
    )
  teacher = Teacher(full_name=payload.full_name, focus_user_id=payload.focus_user_id)
  db.add(teacher)
  db.commit()
  db.refresh(teacher)
  return teacher


@router.get("/{teacher_id}", response_model=TeacherRead)
def get_teacher(
  teacher_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  teacher = db.query(Teacher).get(teacher_id)
  if not teacher:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
  return teacher


@router.patch("/{teacher_id}", response_model=TeacherRead)
def update_teacher(
  teacher_id: int,
  payload: TeacherUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  teacher = db.query(Teacher).get(teacher_id)
  if not teacher:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

  if payload.full_name is not None:
    teacher.full_name = payload.full_name

  db.commit()
  db.refresh(teacher)
  return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(
  teacher_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  teacher = db.query(Teacher).get(teacher_id)
  if not teacher:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
  db.delete(teacher)
  db.commit()
  return None

