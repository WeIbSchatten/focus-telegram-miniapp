"""
Отправка уведомлений в Telegram через бота (POST /notify).
Вызывается после создания ДЗ, оценки, теста, видео.
"""
import threading
import httpx
from app.config.settings import settings

NOTIFY_TYPES = ("new_homework", "new_grade", "lesson_grades", "new_test", "new_video")


def _send_notify_sync(
  focus_user_ids: list[str],
  notify_type: str,
  payload: dict,
) -> None:
  url = (settings.TELEGRAM_BOT_NOTIFY_URL or "").strip().rstrip("/")
  secret = (settings.TELEGRAM_BOT_NOTIFY_SECRET or "").strip()
  if not url or not secret or not focus_user_ids:
    if focus_user_ids and (not url or not secret):
      import logging
      logging.getLogger(__name__).warning(
        "Уведомления в бот отключены: задайте TELEGRAM_BOT_NOTIFY_URL и TELEGRAM_BOT_NOTIFY_SECRET"
      )
    return
  if notify_type not in NOTIFY_TYPES:
    return
  try:
    with httpx.Client(timeout=10.0) as client:
      r = client.post(
        f"{url}/notify",
        json={
          "focus_user_ids": focus_user_ids,
          "type": notify_type,
          "payload": payload,
        },
        headers={"X-Notify-Secret": secret},
      )
      if r.status_code != 200:
        import logging
        logging.getLogger(__name__).warning("Бот уведомлений вернул %s: %s", r.status_code, r.text[:200])
  except Exception as e:
    import logging
    logging.getLogger(__name__).warning("Ошибка отправки уведомления в бот: %s", e)


def notify_students(
  focus_user_ids: list[str],
  notify_type: str,
  payload: dict,
) -> None:
  """Запускает отправку уведомлений в фоне (не блокирует ответ API)."""
  if not focus_user_ids:
    return
  threading.Thread(
    target=_send_notify_sync,
    args=(focus_user_ids, notify_type, payload),
    daemon=True,
  ).start()
