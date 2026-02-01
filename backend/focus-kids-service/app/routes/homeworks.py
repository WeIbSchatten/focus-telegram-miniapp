from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.config.database import get_db
from app.models.homework import Homework, HomeworkFile, HomeworkSubmission, HomeworkSubmissionFile, HomeworkComment
from app.models.program import Program
from app.models.student import Student
from app.services.telegram_notify import notify_students
from app.schemas.homework import (
  HomeworkCreate,
  HomeworkRead,
  HomeworkUpdate,
  HomeworkSubmissionCreate,
  HomeworkSubmissionRead,
  HomeworkSubmissionUpdate,
  HomeworkCommentCreate,
  HomeworkCommentRead,
)
from app.dependencies.roles import get_current_kids_role, require_teacher, require_student

router = APIRouter(prefix="/homeworks", tags=["homeworks"])


@router.get("/", response_model=list[HomeworkRead])
@router.get("", response_model=list[HomeworkRead])
def list_homeworks(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  homeworks = db.query(Homework).options(joinedload(Homework.files)).all()
  return homeworks


@router.get("/by-program/{program_id}", response_model=list[HomeworkRead])
def list_homeworks_by_program(
  program_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  homeworks = (
    db.query(Homework)
    .filter(Homework.program_id == program_id)
    .options(joinedload(Homework.files))
    .order_by(Homework.order)
    .all()
  )
  return homeworks


@router.post("/", response_model=HomeworkRead, status_code=status.HTTP_201_CREATED)
def create_homework(
  payload: HomeworkCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  homework = Homework(
    program_id=payload.program_id,
    title=payload.title,
    description=payload.description,
    order=payload.order,
  )
  db.add(homework)
  db.flush()

  for file_data in payload.files:
    file_obj = HomeworkFile(
      homework_id=homework.id,
      file_url=file_data.file_url,
      file_name=file_data.file_name,
    )
    db.add(file_obj)

  db.commit()
  db.refresh(homework)
  program = db.query(Program).get(payload.program_id)
  if program:
    students = db.query(Student).filter(Student.group_id == program.group_id).all()
    focus_ids = [s.focus_user_id for s in students]
    notify_students(
      focus_ids,
      "new_homework",
      {
        "program_name": program.name,
        "homework_title": payload.title,
        "homework_description": payload.description or None,
      },
    )
  return homework


@router.get("/{homework_id}", response_model=HomeworkRead)
def get_homework(
  homework_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  homework = (
    db.query(Homework)
    .options(joinedload(Homework.files))
    .get(homework_id)
  )
  if not homework:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Домашнее задание не найдено")
  return homework


@router.patch("/{homework_id}", response_model=HomeworkRead)
def update_homework(
  homework_id: int,
  payload: HomeworkUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  homework = db.query(Homework).get(homework_id)
  if not homework:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Домашнее задание не найдено")

  if payload.title is not None:
    homework.title = payload.title
  if payload.description is not None:
    homework.description = payload.description
  if payload.order is not None:
    homework.order = payload.order

  db.commit()
  db.refresh(homework)
  return homework


@router.delete("/{homework_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_homework(
  homework_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  homework = db.query(Homework).get(homework_id)
  if not homework:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Домашнее задание не найдено")
  db.delete(homework)
  db.commit()
  return None


# Submissions
@router.post("/submissions", response_model=HomeworkSubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission(
  payload: HomeworkSubmissionCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_student),
):
  submission = HomeworkSubmission(
    homework_id=payload.homework_id,
    student_id=payload.student_id,
    answer_text=payload.answer_text,
  )
  db.add(submission)
  db.flush()

  for file_data in payload.files:
    file_obj = HomeworkSubmissionFile(
      submission_id=submission.id,
      file_url=file_data.file_url,
      file_name=file_data.file_name,
    )
    db.add(file_obj)

  db.commit()
  db.refresh(submission)
  return submission


@router.get("/submissions/by-homework/{homework_id}", response_model=list[HomeworkSubmissionRead])
def list_submissions_by_homework(
  homework_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  submissions = (
    db.query(HomeworkSubmission)
    .filter(HomeworkSubmission.homework_id == homework_id)
    .options(
      joinedload(HomeworkSubmission.files),
      joinedload(HomeworkSubmission.comments),
    )
    .all()
  )
  return submissions


@router.get("/submissions/by-student/{student_id}", response_model=list[HomeworkSubmissionRead])
def list_submissions_by_student(
  student_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  submissions = (
    db.query(HomeworkSubmission)
    .filter(HomeworkSubmission.student_id == student_id)
    .options(
      joinedload(HomeworkSubmission.files),
      joinedload(HomeworkSubmission.comments),
    )
    .all()
  )
  return submissions


@router.patch("/submissions/{submission_id}", response_model=HomeworkSubmissionRead)
def update_submission(
  submission_id: int,
  payload: HomeworkSubmissionUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  submission = db.query(HomeworkSubmission).get(submission_id)
  if not submission:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ответ не найден")

  if payload.answer_text is not None:
    submission.answer_text = payload.answer_text
  if payload.grade is not None:
    submission.grade = payload.grade
  if payload.teacher_comment is not None:
    submission.teacher_comment = payload.teacher_comment

  db.commit()
  db.refresh(submission)
  return submission


# Comments
@router.post("/submissions/{submission_id}/comments", response_model=HomeworkCommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
  submission_id: int,
  payload: HomeworkCommentCreate,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  comment = HomeworkComment(
    submission_id=submission_id,
    author_id=payload.author_id,
    comment_text=payload.comment_text,
  )
  db.add(comment)
  db.commit()
  db.refresh(comment)
  return comment
