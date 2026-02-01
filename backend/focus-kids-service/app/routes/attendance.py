from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceRead, AttendanceUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)  # без слэша
def create_attendance(
  payload: AttendanceCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  record = Attendance(
    student_id=payload.student_id,
    group_id=payload.group_id,
    lesson_date=payload.lesson_date,
    present=payload.present,
    program_id=payload.program_id,
  )
  db.add(record)
  db.commit()
  db.refresh(record)
  return record


@router.get("/by-student/{student_id}", response_model=list[AttendanceRead])
def list_by_student(
  student_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Attendance).filter(Attendance.student_id == student_id).all()


@router.get("/by-group/{group_id}", response_model=list[AttendanceRead])
def list_by_group(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  return db.query(Attendance).filter(Attendance.group_id == group_id).all()


@router.patch("/{attendance_id}", response_model=AttendanceRead)
def update_attendance(
  attendance_id: int,
  payload: AttendanceUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  record = db.query(Attendance).get(attendance_id)
  if not record:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись посещаемости не найдена")

  if payload.present is not None:
    record.present = payload.present
  if payload.program_id is not None:
    record.program_id = payload.program_id

  db.commit()
  db.refresh(record)
  return record


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
  attendance_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  record = db.query(Attendance).get(attendance_id)
  if not record:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись посещаемости не найдена")
  db.delete(record)
  db.commit()
  return None

