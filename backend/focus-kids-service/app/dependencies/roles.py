"""
Роли в Focus Kids определяются по записям Teacher/Student с focus_user_id = JWT sub.
"""
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.config.database import get_db
from sqlalchemy.orm import Session
from app.models.teacher import Teacher
from app.models.student import Student


def get_current_kids_role(
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db),
):
  """
  Возвращает роль в Focus Kids: teacher, student или None.
  teacher_id / student_id заполнены в зависимости от роли.
  """
  focus_user_id = current_user.get("sub") or current_user.get("userId")
  if not focus_user_id:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")

  # Администратор и модератор всегда имеют права учителя для управления (удаление преподавателей, учеников и т.д.)
  jwt_role = current_user.get("role")
  if jwt_role in ("admin", "moderator"):
    return {
      "role": "teacher",
      "focus_user_id": focus_user_id,
      "teacher_id": None,
      "student_id": None,
    }

  teacher = db.query(Teacher).filter(Teacher.focus_user_id == focus_user_id).first()
  if teacher:
    return {
      "role": "teacher",
      "focus_user_id": focus_user_id,
      "teacher_id": teacher.id,
      "student_id": None,
    }

  student = db.query(Student).filter(Student.focus_user_id == focus_user_id).first()
  if student:
    return {
      "role": "student",
      "focus_user_id": focus_user_id,
      "teacher_id": None,
      "student_id": student.id,
    }

  raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Вы не зарегистрированы как преподаватель или ученик в Focus Kids",
  )


def require_teacher(current: dict = Depends(get_current_kids_role)):
  if current["role"] != "teacher":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Требуется роль преподавателя",
    )
  return current


def require_student(current: dict = Depends(get_current_kids_role)):
  if current["role"] != "student":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Требуется роль ученика",
    )
  return current


def require_teacher_or_student(current: dict = Depends(get_current_kids_role)):
  return current
