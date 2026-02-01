from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, distinct

from app.config.database import get_db
from app.models.program import Program
from app.models.lecture import Lecture
from app.models.homework import Homework
from app.models.test import Test, TestQuestion
from app.models.attendance import Attendance
from app.schemas.program import ProgramCreate, ProgramListRead, ProgramListWithCountsRead, ProgramRead, ProgramUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/programs", tags=["programs"])


@router.get("/", response_model=list[ProgramListRead])
@router.get("", response_model=list[ProgramListRead])
def list_programs(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  programs = db.query(Program).all()
  return programs


@router.get("/with-counts/", response_model=list[ProgramListWithCountsRead])
@router.get("/with-counts", response_model=list[ProgramListWithCountsRead])  # без слэша
def list_programs_with_counts(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  """List programs with lectures_count, homeworks_count, tests_count for learning page."""
  programs = db.query(Program).all()
  if not programs:
    return []
  ids = [p.id for p in programs]
  lecture_counts = {
    pid: c for pid, c in db.query(Lecture.program_id, func.count(Lecture.id))
    .filter(Lecture.program_id.in_(ids)).group_by(Lecture.program_id).all()
  }
  homework_counts = {
    pid: c for pid, c in db.query(Homework.program_id, func.count(Homework.id))
    .filter(Homework.program_id.in_(ids)).group_by(Homework.program_id).all()
  }
  test_counts = {
    pid: c for pid, c in db.query(Test.program_id, func.count(Test.id))
    .filter(Test.program_id.in_(ids)).group_by(Test.program_id).all()
  }
  # Проведённых занятий по программе: число уникальных дат в attendance с program_id = p.id и group_id = p.group_id
  lessons_counts = {}
  for p in programs:
    cnt = db.query(func.count(distinct(Attendance.lesson_date))).filter(
      Attendance.program_id == p.id,
      Attendance.group_id == p.group_id,
    ).scalar()
    lessons_counts[p.id] = cnt or 0
  return [
    ProgramListWithCountsRead(
      id=p.id,
      name=p.name,
      description=p.description,
      group_id=p.group_id,
      lectures_count=lecture_counts.get(p.id, 0),
      homeworks_count=homework_counts.get(p.id, 0),
      tests_count=test_counts.get(p.id, 0),
      lessons_count=lessons_counts.get(p.id, 0),
    )
    for p in programs
  ]


@router.get("/by-group/{group_id}", response_model=list[ProgramListRead])
def list_programs_by_group(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  programs = db.query(Program).filter(Program.group_id == group_id).all()
  return programs


@router.post("/", response_model=ProgramRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=ProgramRead, status_code=status.HTTP_201_CREATED)  # без слэша
def create_program(
  payload: ProgramCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  program = Program(
    name=payload.name,
    description=payload.description,
    group_id=payload.group_id,
  )
  db.add(program)
  db.commit()
  db.refresh(program)
  return program


@router.get("/{program_id}", response_model=ProgramRead)
def get_program(
  program_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  # filter().first() с options гарантирует подгрузку связей; .get() может их не применить и вызвать 500 при сериализации
  program = (
    db.query(Program)
    .options(
      joinedload(Program.lectures),
      joinedload(Program.homeworks).joinedload(Homework.files),
      joinedload(Program.tests).joinedload(Test.questions).joinedload(TestQuestion.answers),
    )
    .filter(Program.id == program_id)
    .first()
  )
  if not program:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Программа не найдена")
  return program


@router.patch("/{program_id}", response_model=ProgramRead)
def update_program(
  program_id: int,
  payload: ProgramUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  program = db.query(Program).get(program_id)
  if not program:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Программа не найдена")

  if payload.name is not None:
    program.name = payload.name
  if payload.description is not None:
    program.description = payload.description

  db.commit()
  db.refresh(program)
  return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(
  program_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  program = db.query(Program).get(program_id)
  if not program:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Программа не найдена")
  db.delete(program)
  db.commit()
  return None
