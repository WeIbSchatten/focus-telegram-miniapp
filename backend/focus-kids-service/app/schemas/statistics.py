from pydantic import BaseModel
from datetime import date


class StudentStatisticsBase(BaseModel):
  student_id: int
  total_lessons: int
  attended_lessons: int
  attendance_rate: float
  average_grade: float | None = None
  total_grades: int = 0
  completed_homeworks: int = 0
  total_homeworks: int = 0
  completed_tests: int = 0
  total_tests: int = 0
  average_test_score: float | None = None


class StudentStatisticsRead(StudentStatisticsBase):
  class Config:
    from_attributes = True


class TeacherGroupStatisticsBase(BaseModel):
  group_id: int
  group_name: str
  total_students: int
  average_attendance_rate: float
  average_grade: float | None = None
  total_lessons: int = 0


class TeacherGroupStatisticsRead(TeacherGroupStatisticsBase):
  class Config:
    from_attributes = True


class TeacherStatisticsBase(BaseModel):
  teacher_id: int
  total_groups: int
  total_students: int
  groups: list[TeacherGroupStatisticsRead] = []


class TeacherStatisticsRead(TeacherStatisticsBase):
  class Config:
    from_attributes = True
