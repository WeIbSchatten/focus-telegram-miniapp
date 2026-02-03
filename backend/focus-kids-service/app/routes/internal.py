"""
Внутренние эндпоинты для бота и Focus service (защита по X-Internal-Secret).
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, exists

from app.config.database import get_db
from app.config.settings import settings
from app.models.student import Student
from app.models.homework import Homework, HomeworkSubmission
from app.models.test import Test, TestSubmission
from app.models.program import Program

router = APIRouter(prefix="/internal", tags=["internal"])


def _require_internal_secret(request: Request) -> None:
    secret = (settings.INTERNAL_API_SECRET or "").strip()
    if not secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="INTERNAL_API_SECRET not configured")
    header = (request.headers.get("X-Internal-Secret") or "").strip()
    if header != secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid X-Internal-Secret")


@router.get("/student-status")
def get_student_status(
    focus_user_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """По focus_user_id вернуть статус ученика: новое ДЗ и непройденные тесты."""
    _require_internal_secret(request)
    fid = (focus_user_id or "").strip()
    if not fid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="focus_user_id required")

    student = db.query(Student).filter(Student.focus_user_id == fid).first()
    if not student:
        return {"is_student": False, "new_homework_count": 0, "unpassed_tests_count": 0}

    if not student.group_id:
        return {"is_student": True, "new_homework_count": 0, "unpassed_tests_count": 0}

    program_ids = [p.id for p in db.query(Program).filter(Program.group_id == student.group_id).all()]
    if not program_ids:
        return {"is_student": True, "new_homework_count": 0, "unpassed_tests_count": 0}

    # ДЗ по программам группы без сдачи этого ученика
    homeworks_without_submission = (
        db.query(Homework.id)
        .filter(Homework.program_id.in_(program_ids))
        .filter(
            ~exists().where(
                and_(
                    HomeworkSubmission.homework_id == Homework.id,
                    HomeworkSubmission.student_id == student.id,
                )
            )
        )
    ).count()

    # Тесты по программам группы без ни одной попытки этого ученика
    tests_without_submission = (
        db.query(Test.id)
        .filter(Test.program_id.in_(program_ids))
        .filter(
            ~exists().where(
                and_(
                    TestSubmission.test_id == Test.id,
                    TestSubmission.student_id == student.id,
                )
            )
        )
    ).count()

    return {
        "is_student": True,
        "new_homework_count": homeworks_without_submission,
        "unpassed_tests_count": tests_without_submission,
    }
