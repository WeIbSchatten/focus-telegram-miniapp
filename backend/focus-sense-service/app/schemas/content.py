from pydantic import BaseModel


class WeeklyIntentionRead(BaseModel):
    id: int
    text: str
    order: int

    class Config:
        from_attributes = True


class DailyQuestionRead(BaseModel):
    id: int
    text: str
    order: int

    class Config:
        from_attributes = True


class WeeklyIntentionListUpdate(BaseModel):
    """Список установок на неделю (через запятую в UI сохраняем как массив)."""
    items: list[str]


class DailyQuestionListUpdate(BaseModel):
    """Список вопросов дня (через запятую в UI сохраняем как массив)."""
    items: list[str]
