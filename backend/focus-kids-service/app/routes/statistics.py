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
  # Ученик — только свои данные; администратор и модератор (роль teacher с student_id=None) — полный доступ
  if current["role"] == "student" and current["student_id"] != student_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ только к своей статистике")
  student = db.query(Student).get(student_id)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ученик не найден")

  # Посещаемость
  attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
  total_lessons = len(attendance_records)
  attended_lessons = sum(1 for a in attendance_records if a.present)
  attendance_rate = (attended_lessons / total_lessons * 100) if total_lessons > 0 else 0.0

  # Оценки за занятия: только типы, которые являются оценками 1–5 (без homework_next, teacher_comment и тестов)
  grades = db.query(Grade).filter(Grade.student_id == student_id).all()
  lesson_grade_types = ("oral_hw", "written_hw", "dictation", "classwork")
  grades_for_avg = [g for g in grades if g.type in lesson_grade_types]
  total_grades = len(grades_for_avg)
  average_grade = sum(g.value for g in grades_for_avg) / total_grades if total_grades > 0 else None

  # Домашние задания: из программ (Homework + HomeworkSubmission) и с уроков (оценки homework_next)
  from app.models.program import Program

  program_total_hw = 0
  program_completed_hw = 0
  if student.group_id:
    group_programs = db.query(Program).filter(Program.group_id == student.group_id).all()
    program_ids = [p.id for p in group_programs]
    if program_ids:
      group_homeworks = db.query(Homework).filter(Homework.program_id.in_(program_ids)).all()
      program_total_hw = len(group_homeworks)
      homework_ids = [h.id for h in group_homeworks]
      if homework_ids:
        program_completed_hw = db.query(HomeworkSubmission).filter(
          and_(
            HomeworkSubmission.student_id == student_id,
            HomeworkSubmission.homework_id.in_(homework_ids)
          )
        ).count()
      else:
        program_completed_hw = 0
    else:
      program_total_hw = 0
      program_completed_hw = 0
  else:
    program_total_hw = 0
    program_completed_hw = 0

  # ДЗ с уроков: оценки типа homework_next; «выполнено» — если на более позднем уроке есть oral_hw или written_hw
  lesson_hw_grades = [
    g for g in grades
    if g.type == "homework_next" and g.lesson_date is not None
  ]
  lesson_hw_total = len(lesson_hw_grades)
  lesson_hw_completed = 0
  for g in lesson_hw_grades:
    assigned_date = g.lesson_date
    has_later_grade = any(
      og.type in ("oral_hw", "written_hw") and og.lesson_date is not None and og.lesson_date > assigned_date
      for og in grades
    )
    if has_later_grade:
      lesson_hw_completed += 1

  total_homeworks = program_total_hw + lesson_hw_total
  completed_homeworks = program_completed_hw + lesson_hw_completed

  # Тесты: считаем количество решённых тестов (уникальных), средний балл — по лучшей попытке по каждому тесту
  if student.group_id:
    group_programs = db.query(Program).filter(Program.group_id == student.group_id).all()
    program_ids = [p.id for p in group_programs]
    if program_ids:
      group_tests = db.query(Test).filter(Test.program_id.in_(program_ids)).all()
      total_tests = len(group_tests)
      test_ids = [t.id for t in group_tests]
      if test_ids:
        test_submissions = db.query(TestSubmission).filter(
          and_(
            TestSubmission.student_id == student_id,
            TestSubmission.test_id.in_(test_ids),
            TestSubmission.score.isnot(None),
          )
        ).all()
        # Уникальные тесты (сколько тестов решено), лучшая попытка по каждому тесту
        best_by_test: dict[int, TestSubmission] = {}
        for s in test_submissions:
          prev = best_by_test.get(s.test_id)
          s_score = s.score or -1
          prev_score = prev.score if prev else -1
          if prev is None or s_score > prev_score:
            best_by_test[s.test_id] = s
        completed_tests = len(best_by_test)
        if best_by_test:
          total_score = sum(s.score for s in best_by_test.values())
          total_max = sum(s.max_score or 0 for s in best_by_test.values())
          average_test_score = (total_score / total_max * 100) if total_max > 0 else None
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
  # Учитель — только свои данные; администратор и модератор — полный доступ (teacher_id is None)
  if current["role"] != "teacher":
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Требуется роль преподавателя")
  if current["teacher_id"] is not None and current["teacher_id"] != teacher_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ только к своей статистике преподавателя")

  groups = db.query(Group).filter(Group.teacher_id == teacher_id).all()
  total_groups = len(groups)
  group_stats = []
  total_students = 0

  for gr in groups:
    students = db.query(Student).filter(Student.group_id == gr.id).all()
    group_students_count = len(students)
    total_students += group_students_count

    attendance_records = db.query(Attendance).filter(Attendance.group_id == gr.id).all()
    total_lessons = len(attendance_records)
    attended_lessons = sum(1 for a in attendance_records if a.present)
    avg_attendance = (attended_lessons / total_lessons * 100) if total_lessons > 0 else 0.0

    grades = db.query(Grade).filter(Grade.group_id == gr.id).all()
    lesson_grade_types = ("oral_hw", "written_hw", "dictation", "classwork")
    grades_for_avg = [g for g in grades if g.type in lesson_grade_types]
    avg_grade = (sum(g.value for g in grades_for_avg) / len(grades_for_avg)) if grades_for_avg else None

    group_stats.append(
      TeacherGroupStatisticsRead(
        group_id=gr.id,
        group_name=gr.name or "",
        total_students=group_students_count,
        average_attendance_rate=round(avg_attendance, 2),
        average_grade=round(avg_grade, 2) if avg_grade is not None else None,
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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Группа не найдена")

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
    lesson_grade_types = ("oral_hw", "written_hw", "dictation", "classwork")
    grades_for_avg = [g for g in student_grades if g.type in lesson_grade_types]
    avg_grade = sum(g.value for g in grades_for_avg) / len(grades_for_avg) if grades_for_avg else None
    
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
