from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.grade import Grade
from app.models.student import Student
from app.schemas.grade import GradeCreate, GradeRead, GradeUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher
from app.services.telegram_notify import notify_students

router = APIRouter(prefix="/grades", tags=["grades"])


def _notify_for_lesson(
  group_id: int,
  lesson_date: str,
  program_name: str | None,
  db: Session,
) -> None:
  students = db.query(Student).filter(Student.group_id == group_id).all()
  focus_user_ids = [s.focus_user_id for s in students if s.focus_user_id]
  if not focus_user_ids:
    return
  notify_students(
    focus_user_ids,
    "lesson_grades",
    {"lesson_date": lesson_date, "program_name": program_name or None},
  )


@router.post("/", response_model=GradeRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=GradeRead, status_code=status.HTTP_201_CREATED)  # без слэша
def create_grade(
  payload: GradeCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  grade = Grade(
    student_id=payload.student_id,
    group_id=payload.group_id,
    lesson_date=payload.lesson_date,
    value=payload.value,
    type=payload.type,
    comment=payload.comment,
    program_id=payload.program_id,
  )
  db.add(grade)
  db.commit()
  db.refresh(grade)
  return grade


@router.post("/notify-for-lesson", status_code=status.HTTP_204_NO_CONTENT)
@router.post("/notify-for-lesson/", status_code=status.HTTP_204_NO_CONTENT)
def notify_for_lesson(
  body: dict = Body(..., embed=False),
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
) -> None:
  group_id = body.get("group_id")
  lesson_date = body.get("lesson_date")
  if group_id is None or not lesson_date:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Укажите group_id и lesson_date")
  program_name = body.get("program_name")
  _notify_for_lesson(int(group_id), str(lesson_date), str(program_name) if program_name else None, db)


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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Оценка не найдена")

  if payload.lesson_date is not None:
    grade.lesson_date = payload.lesson_date
  if payload.value is not None:
    grade.value = payload.value
  if payload.type is not None:
    grade.type = payload.type
  if payload.comment is not None:
    grade.comment = payload.comment
  if payload.program_id is not None:
    grade.program_id = payload.program_id

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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Оценка не найдена")
  db.delete(grade)
  db.commit()
  return None

