from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
import json

from app.config.database import get_db
from app.models.test import (
  Test,
  TestQuestion,
  TestAnswer,
  TestSubmission,
  TestSubmissionAnswer,
)
from app.schemas.test import (
  TestCreate,
  TestRead,
  TestUpdate,
  TestSubmissionCreate,
  TestSubmissionRead,
  TestSubmissionUpdate,
)
from app.dependencies.roles import get_current_kids_role, require_teacher, require_student

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/", response_model=list[TestRead])
def list_tests(
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  tests = (
    db.query(Test)
    .options(
      joinedload(Test.questions).joinedload(TestQuestion.answers),
    )
    .all()
  )
  return tests


@router.get("/by-program/{program_id}", response_model=list[TestRead])
def list_tests_by_program(
  program_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  tests = (
    db.query(Test)
    .filter(Test.program_id == program_id)
    .options(
      joinedload(Test.questions).joinedload(TestQuestion.answers),
    )
    .order_by(Test.order)
    .all()
  )
  return tests


@router.post("/", response_model=TestRead, status_code=status.HTTP_201_CREATED)
def create_test(
  payload: TestCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  test = Test(
    program_id=payload.program_id,
    title=payload.title,
    description=payload.description,
    order=payload.order,
  )
  db.add(test)
  db.flush()

  for q_data in payload.questions:
    question = TestQuestion(
      test_id=test.id,
      question_text=q_data.question_text,
      question_type=q_data.question_type,
      order=q_data.order,
    )
    db.add(question)
    db.flush()

    for a_data in q_data.answers:
      answer = TestAnswer(
        question_id=question.id,
        answer_text=a_data.answer_text,
        is_correct=a_data.is_correct,
        order=a_data.order,
      )
      db.add(answer)

  db.commit()
  db.refresh(test)
  return test


@router.get("/{test_id}", response_model=TestRead)
def get_test(
  test_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  test = (
    db.query(Test)
    .options(
      joinedload(Test.questions).joinedload(TestQuestion.answers),
    )
    .get(test_id)
  )
  if not test:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
  return test


@router.patch("/{test_id}", response_model=TestRead)
def update_test(
  test_id: int,
  payload: TestUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  test = db.query(Test).get(test_id)
  if not test:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")

  if payload.title is not None:
    test.title = payload.title
  if payload.description is not None:
    test.description = payload.description
  if payload.order is not None:
    test.order = payload.order

  db.commit()
  db.refresh(test)
  return test


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
  test_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  test = db.query(Test).get(test_id)
  if not test:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
  db.delete(test)
  db.commit()
  return None


# Submissions
@router.post("/submissions", response_model=TestSubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission(
  payload: TestSubmissionCreate,
  db: Session = Depends(get_db),
  _user=Depends(require_student),
):
  # Получаем тест с вопросами и правильными ответами
  test = (
    db.query(Test)
    .options(
      joinedload(Test.questions).joinedload(TestQuestion.answers),
    )
    .get(payload.test_id)
  )
  if not test:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")

  # Создаём submission
  submission = TestSubmission(
    test_id=payload.test_id,
    student_id=payload.student_id,
  )
  db.add(submission)
  db.flush()

  # Подсчитываем баллы
  score = 0
  max_score = len(test.questions)

  for answer_data in payload.answers:
    question = db.query(TestQuestion).get(answer_data.question_id)
    if not question:
      continue

    # Создаём ответ ученика
    submission_answer = TestSubmissionAnswer(
      submission_id=submission.id,
      question_id=answer_data.question_id,
      answer_text=answer_data.answer_text,
      selected_answer_ids=answer_data.selected_answer_ids,
    )
    db.add(submission_answer)

    # Проверяем правильность ответа
    if question.question_type == "single_choice":
      correct_answer = next((a for a in question.answers if a.is_correct), None)
      if correct_answer and answer_data.selected_answer_ids:
        selected_ids = json.loads(answer_data.selected_answer_ids)
        if str(correct_answer.id) in selected_ids or correct_answer.id in selected_ids:
          score += 1
    elif question.question_type == "multiple_choice":
      correct_answers = [a.id for a in question.answers if a.is_correct]
      if answer_data.selected_answer_ids:
        selected_ids = json.loads(answer_data.selected_answer_ids)
        if set(correct_answers) == set(selected_ids):
          score += 1
    elif question.question_type == "text":
      # Для текстовых вопросов нужна ручная проверка учителем
      pass

  submission.score = score
  submission.max_score = max_score

  db.commit()
  db.refresh(submission)
  return submission


@router.get("/submissions/by-test/{test_id}", response_model=list[TestSubmissionRead])
def list_submissions_by_test(
  test_id: int,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  submissions = (
    db.query(TestSubmission)
    .filter(TestSubmission.test_id == test_id)
    .options(joinedload(TestSubmission.answers))
    .all()
  )
  return submissions


@router.get("/submissions/by-student/{student_id}", response_model=list[TestSubmissionRead])
def list_submissions_by_student(
  student_id: int,
  db: Session = Depends(get_db),
  _user=Depends(get_current_kids_role),
):
  submissions = (
    db.query(TestSubmission)
    .filter(TestSubmission.student_id == student_id)
    .options(joinedload(TestSubmission.answers))
    .all()
  )
  return submissions


@router.patch("/submissions/{submission_id}", response_model=TestSubmissionRead)
def update_submission(
  submission_id: int,
  payload: TestSubmissionUpdate,
  db: Session = Depends(get_db),
  _user=Depends(require_teacher),
):
  submission = db.query(TestSubmission).get(submission_id)
  if not submission:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

  if payload.is_approved_for_retake is not None:
    submission.is_approved_for_retake = payload.is_approved_for_retake

  db.commit()
  db.refresh(submission)
  return submission
