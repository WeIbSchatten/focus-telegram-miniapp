from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.grade import Grade
from app.schemas.grade import GradeCreate, GradeRead, GradeUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/grades", tags=["grades"])


@router.post("/", response_model=GradeRead, status_code=status.HTTP_201_CREATED)
def create_grade(
  payload: GradeCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  grade = Grade(
    student_id=payload.student_id,
    group_id=payload.group_id,
    value=payload.value,
    type=payload.type,
    comment=payload.comment,
  )
  db.add(grade)
  db.commit()
  db.refresh(grade)
  return grade


@router.get("/by-student/{student_id}", response_model=list[GradeRead])
def list_by_student(
  student_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Grade).filter(Grade.student_id == student_id).all()


@router.get("/by-group/{group_id}", response_model=list[GradeRead])
def list_by_group(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Grade).filter(Grade.group_id == group_id).all()


@router.patch("/{grade_id}", response_model=GradeRead)
def update_grade(
  grade_id: int,
  payload: GradeUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  grade = db.query(Grade).get(grade_id)
  if not grade:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")

  if payload.value is not None:
    grade.value = payload.value
  if payload.type is not None:
    grade.type = payload.type
  if payload.comment is not None:
    grade.comment = payload.comment

  db.commit()
  db.refresh(grade)
  return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
  grade_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  grade = db.query(Grade).get(grade_id)
  if not grade:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
  db.delete(grade)
  db.commit()
  return None

