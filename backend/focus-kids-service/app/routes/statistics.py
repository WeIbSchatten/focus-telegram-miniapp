from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.config.database import get_db
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.grade import Grade
from app.models.group import Group
from app.models.homework import Homework, HomeworkSubmission
from app.models.test import Test, TestSubmission
from app.schemas.statistics import (
  StudentStatisticsRead,
  TeacherStatisticsRead,
  TeacherGroupStatisticsRead,
)
from app.dependencies.roles import get_current_kids_role, require_teacher

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("/students/{student_id}", response_model=StudentStatisticsRead)
def get_student_statistics(
  student_id: int,
  db: Session = Depends(get_db),
  current=Depends(get_current_kids_role),
):
  if current["role"] == "student" and current["student_id"] != student_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only view own statistics")
  student = db.query(Student).get(student_id)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

  # Посещаемость
  attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
  total_lessons = len(attendance_records)
  attended_lessons = sum(1 for a in attendance_records if a.present)
  attendance_rate = (attended_lessons / total_lessons * 100) if total_lessons > 0 else 0.0

  # Оценки
  grades = db.query(Grade).filter(Grade.student_id == student_id).all()
  total_grades = len(grades)
  average_grade = sum(g.value for g in grades) / total_grades if total_grades > 0 else None

  # Домашние задания
  from app.models.program import Program
  if student.group_id:
    group_programs = db.query(Program).filter(Program.group_id == student.group_id).all()
    program_ids = [p.id for p in group_programs]
    if program_ids:
      group_homeworks = db.query(Homework).filter(Homework.program_id.in_(program_ids)).all()
      total_homeworks = len(group_homeworks)
      homework_ids = [h.id for h in group_homeworks]
      if homework_ids:
        completed_homeworks = db.query(HomeworkSubmission).filter(
          and_(
            HomeworkSubmission.student_id == student_id,
            HomeworkSubmission.homework_id.in_(homework_ids)
          )
        ).count()
      else:
        completed_homeworks = 0
    else:
      total_homeworks = 0
      completed_homeworks = 0
  else:
    total_homeworks = 0
    completed_homeworks = 0

  # Тесты
  if student.group_id:
    group_programs = db.query(Program).filter(Program.group_id == student.group_id).all()
    program_ids = [p.id for p in group_programs]
    if program_ids:
      group_tests = db.query(Test).filter(Test.program_id.in_(program_ids)).all()
      total_tests = len(group_tests)
      test_ids = [t.id for t in group_tests]
      if test_ids:
        completed_tests = db.query(TestSubmission).filter(
          and_(
            TestSubmission.student_id == student_id,
            TestSubmission.test_id.in_(test_ids)
          )
        ).count()
        test_submissions = db.query(TestSubmission).filter(
          and_(
            TestSubmission.student_id == student_id,
            TestSubmission.test_id.in_(test_ids),
            TestSubmission.score.isnot(None)
          )
        ).all()
        if test_submissions:
          total_score = sum(s.score for s in test_submissions)
          max_score = sum(s.max_score for s in test_submissions) if all(s.max_score for s in test_submissions) else len(test_submissions) * 100
          average_test_score = (total_score / max_score * 100) if max_score > 0 else None
        else:
          average_test_score = None
      else:
        completed_tests = 0
        average_test_score = None
    else:
      total_tests = 0
      completed_tests = 0
      average_test_score = None
  else:
    total_tests = 0
    completed_tests = 0
    average_test_score = None

  return StudentStatisticsRead(
    student_id=student_id,
    total_lessons=total_lessons,
    attended_lessons=attended_lessons,
    attendance_rate=round(attendance_rate, 2),
    average_grade=round(average_grade, 2) if average_grade else None,
    total_grades=total_grades,
    completed_homeworks=completed_homeworks,
    total_homeworks=total_homeworks,
    completed_tests=completed_tests,
    total_tests=total_tests,
    average_test_score=round(average_test_score, 2) if average_test_score else None,
  )


@router.get("/teachers/{teacher_id}", response_model=TeacherStatisticsRead)
def get_teacher_statistics(
  teacher_id: int,
  db: Session = Depends(get_db),
  current=Depends(get_current_kids_role),
):
  if current["role"] != "teacher" or current["teacher_id"] != teacher_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only view own teacher statistics")
  # Получаем все группы учителя
  groups = db.query(Group).filter(Group.teacher_id == teacher_id).all()
  total_groups = len(groups)

  group_stats = []
  total_students = 0

  for group in groups:
    students = db.query(Student).filter(Student.group_id == group.id).all()
    group_students_count = len(students)
    total_students += group_students_count

    # Средняя посещаемость по группе
    attendance_records = db.query(Attendance).filter(Attendance.group_id == group.id).all()
    if attendance_records:
      total_lessons = len(attendance_records)
      attended_lessons = sum(1 for a in attendance_records if a.present)
      avg_attendance = (attended_lessons / total_lessons * 100) if total_lessons > 0 else 0.0
    else:
      avg_attendance = 0.0
      total_lessons = 0

    # Средняя оценка по группе
    grades = db.query(Grade).filter(Grade.group_id == group.id).all()
    if grades:
      avg_grade = sum(g.value for g in grades) / len(grades)
    else:
      avg_grade = None

    group_stats.append(
      TeacherGroupStatisticsRead(
        group_id=group.id,
        group_name=group.name,
        total_students=group_students_count,
        average_attendance_rate=round(avg_attendance, 2),
        average_grade=round(avg_grade, 2) if avg_grade else None,
        total_lessons=total_lessons,
      )
    )

  return TeacherStatisticsRead(
    teacher_id=teacher_id,
    total_groups=total_groups,
    total_students=total_students,
    groups=group_stats,
  )


@router.get("/groups/{group_id}/overview")
def get_group_overview(
  group_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  group = db.query(Group).get(group_id)
  if not group:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

  students = db.query(Student).filter(Student.group_id == group_id).all()
  
  # Статистика по посещаемости
  attendance_records = db.query(Attendance).filter(Attendance.group_id == group_id).all()
  total_lessons = len(set(a.lesson_date for a in attendance_records))
  
  student_stats = []
  for student in students:
    student_attendance = [a for a in attendance_records if a.student_id == student.id]
    attended = sum(1 for a in student_attendance if a.present)
    attendance_rate = (attended / len(student_attendance) * 100) if student_attendance else 0.0
    
    student_grades = db.query(Grade).filter(Grade.student_id == student.id).all()
    avg_grade = sum(g.value for g in student_grades) / len(student_grades) if student_grades else None
    
    student_stats.append({
      "student_id": student.id,
      "full_name": student.full_name,
      "attendance_rate": round(attendance_rate, 2),
      "average_grade": round(avg_grade, 2) if avg_grade else None,
      "total_grades": len(student_grades),
    })

  return {
    "group_id": group_id,
    "group_name": group.name,
    "total_students": len(students),
    "total_lessons": total_lessons,
    "students": student_stats,
  }
