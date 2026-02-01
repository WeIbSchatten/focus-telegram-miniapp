from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher
from app.services.focus_client import focus_user_exists_sync

router = APIRouter(prefix="/students", tags=["students"])


def _get_bearer_token(request: Request) -> str | None:
  auth = request.headers.get("Authorization")
  if auth and auth.startswith("Bearer "):
    return auth[7:]
  return None


@router.get("/", response_model=list[StudentRead])
@router.get("", response_model=list[StudentRead])  # без слэша: /api/students
def list_students(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  students = db.query(Student).all()
  return students


@router.post("/", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=StudentRead, status_code=status.HTTP_201_CREATED)  # без слэша
def create_student(
  payload: StudentCreate,
  request: Request,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  result = focus_user_exists_sync(payload.focus_user_id, _get_bearer_token(request))
  if result == "not_found":
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Пользователь не найден в сервисе Focus",
    )
  student = Student(
    full_name=payload.full_name,
    focus_user_id=payload.focus_user_id,
    group_id=payload.group_id,
  )
  db.add(student)
  db.commit()
  db.refresh(student)
  return student


@router.get("/{student_id}", response_model=StudentRead)
def get_student(
  student_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  student = db.query(Student).get(student_id)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ученик не найден")
  return student


@router.patch("/{student_id}", response_model=StudentRead)
def update_student(
  student_id: int,
  payload: StudentUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  student = db.query(Student).get(student_id)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ученик не найден")
  if payload.full_name is not None:
    student.full_name = payload.full_name
  if payload.group_id is not None:
    student.group_id = payload.group_id
  db.commit()
  db.refresh(student)
  return student

