from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.config.database import get_db
from app.models.program import Program
from app.schemas.program import ProgramCreate, ProgramRead, ProgramUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/programs", tags=["programs"])


@router.get("/", response_model=list[ProgramRead])
def list_programs(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  programs = (
    db.query(Program)
    .options(
      joinedload(Program.lectures),
      joinedload(Program.homeworks).joinedload("files"),
      joinedload(Program.tests).joinedload("questions").joinedload("answers"),
    )
    .all()
  )
  return programs


@router.get("/by-group/{group_id}", response_model=list[ProgramRead])
def list_programs_by_group(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  programs = (
    db.query(Program)
    .filter(Program.group_id == group_id)
    .options(
      joinedload(Program.lectures),
      joinedload(Program.homeworks).joinedload("files"),
      joinedload(Program.tests).joinedload("questions").joinedload("answers"),
    )
    .all()
  )
  return programs


@router.post("/", response_model=ProgramRead, status_code=status.HTTP_201_CREATED)
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
  program = (
    db.query(Program)
    .options(
      joinedload(Program.lectures),
      joinedload(Program.homeworks).joinedload("files"),
      joinedload(Program.tests).joinedload("questions").joinedload("answers"),
    )
    .get(program_id)
  )
  if not program:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")

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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
  db.delete(program)
  db.commit()
  return None
