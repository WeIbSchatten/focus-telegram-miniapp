from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.config.database import get_db
from app.models.group import Group
from app.models.student import Student
from app.schemas.group import GroupCreate, GroupRead, GroupUpdate
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=list[GroupRead])
def list_groups(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  groups = (
    db.query(Group)
    .options(joinedload(Group.teacher), joinedload(Group.students))
    .all()
  )
  return groups


@router.post("/", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
  payload: GroupCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  group = Group(name=payload.name, level=payload.level, teacher_id=payload.teacher_id)
  db.add(group)
  db.commit()
  db.refresh(group)
  return group


@router.get("/{group_id}", response_model=GroupRead)
def get_group(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  group = (
    db.query(Group)
    .options(joinedload(Group.teacher), joinedload(Group.students))
    .get(group_id)
  )
  if not group:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
  return group


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
  group_id: int,
  payload: GroupUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  group = db.query(Group).get(group_id)
  if not group:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

  if payload.name is not None:
    group.name = payload.name
  if payload.level is not None:
    group.level = payload.level
  if payload.teacher_id is not None:
    group.teacher_id = payload.teacher_id

  db.commit()
  db.refresh(group)
  return group


@router.post("/{group_id}/assign-student", response_model=GroupRead)
def assign_student_to_group(
  group_id: int,
  student_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  group = db.query(Group).get(group_id)
  if not group:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

  student = db.query(Student).get(student_id)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

  student.group_id = group_id
  db.commit()

  db.refresh(group)
  return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  group = db.query(Group).get(group_id)
  if not group:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
  db.delete(group)
  db.commit()
  return None

