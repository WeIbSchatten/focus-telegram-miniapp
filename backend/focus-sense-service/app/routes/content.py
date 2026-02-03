from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config.database import get_db
from app.models.weekly_intention import WeeklyIntention
from app.models.daily_question import DailyQuestion
from app.schemas.content import (
    WeeklyIntentionRead,
    DailyQuestionRead,
    WeeklyIntentionListUpdate,
    DailyQuestionListUpdate,
)
from app.dependencies.auth import require_admin_or_moderator, verify_sense_access

router = APIRouter(prefix="/content", tags=["content"])

# Часовой пояс для обновления в 00:00 (можно вынести в settings)
TZ = ZoneInfo("Europe/Moscow")


def _monday_this_week(d: date) -> date:
    """Понедельник текущей недели (ISO)."""
    return d - timedelta(days=d.weekday())


def _week_seed(d: date) -> str:
    return _monday_this_week(d).isoformat()


def _day_seed(d: date) -> str:
    return d.isoformat()


@router.get("/weekly-intention", response_model=WeeklyIntentionRead | None)
def get_random_weekly_intention(
    db: Session = Depends(get_db),
    _user=Depends(verify_sense_access),
):
    """Одна случайная установка на текущую неделю. Обновляется в 00:00 понедельника."""
    seed = _week_seed(date.today())
    # Детерминированный «случайный» выбор по seed недели
    row = db.execute(
        text(
            """
            SELECT id, text, "order" FROM sense_weekly_intentions
            ORDER BY md5(id::text || :seed)
            LIMIT 1
            """
        ),
        {"seed": seed},
    ).first()
    if not row:
        return None
    return WeeklyIntentionRead(id=row[0], text=row[1], order=row[2])


@router.get("/daily-question", response_model=DailyQuestionRead | None)
def get_random_daily_question(
    db: Session = Depends(get_db),
    _user=Depends(verify_sense_access),
):
    """Один случайный вопрос на сегодня. Обновляется в 00:00 каждый день."""
    seed = _day_seed(date.today())
    row = db.execute(
        text(
            """
            SELECT id, text, "order" FROM sense_daily_questions
            ORDER BY md5(id::text || :seed)
            LIMIT 1
            """
        ),
        {"seed": seed},
    ).first()
    if not row:
        return None
    return DailyQuestionRead(id=row[0], text=row[1], order=row[2])


# --- Admin: полные списки и обновление ---

@router.get("/weekly-intentions", response_model=list[WeeklyIntentionRead])
def list_weekly_intentions(
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    return (
        db.query(WeeklyIntention)
        .order_by(WeeklyIntention.order, WeeklyIntention.id)
        .all()
    )


@router.post("/weekly-intentions", response_model=list[WeeklyIntentionRead])
def replace_weekly_intentions(
    payload: WeeklyIntentionListUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    db.query(WeeklyIntention).delete()
    for i, text_item in enumerate(payload.items):
        t = (text_item or "").strip()
        if t:
            db.add(WeeklyIntention(text=t, order=i))
    db.commit()
    return (
        db.query(WeeklyIntention)
        .order_by(WeeklyIntention.order, WeeklyIntention.id)
        .all()
    )


@router.get("/daily-questions", response_model=list[DailyQuestionRead])
def list_daily_questions(
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    return (
        db.query(DailyQuestion)
        .order_by(DailyQuestion.order, DailyQuestion.id)
        .all()
    )


@router.post("/daily-questions", response_model=list[DailyQuestionRead])
def replace_daily_questions(
    payload: DailyQuestionListUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    db.query(DailyQuestion).delete()
    for i, text_item in enumerate(payload.items):
        t = (text_item or "").strip()
        if t:
            db.add(DailyQuestion(text=t, order=i))
    db.commit()
    return (
        db.query(DailyQuestion)
        .order_by(DailyQuestion.order, DailyQuestion.id)
        .all()
    )
