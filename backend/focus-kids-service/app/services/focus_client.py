"""
Проверка существования пользователя в Focus сервисе по focus_user_id.
"""
import httpx
from app.config.settings import settings

# "exists" | "not_found" | "error" (сервис недоступен — в dev разрешаем создание)
Result = str


async def focus_user_exists_async(focus_user_id: str, token: str | None = None) -> Result:
  try:
    async with httpx.AsyncClient() as client:
      headers = {"Authorization": f"Bearer {token}"} if token else {}
      response = await client.get(
        f"{settings.FOCUS_SERVICE_URL}/api/users/{focus_user_id}",
        headers=headers,
        timeout=5.0,
      )
      if response.status_code == 200:
        return "exists"
      if response.status_code == 404:
        return "not_found"
      return "error"
  except httpx.RequestError:
    return "error"


def focus_user_exists_sync(focus_user_id: str, token: str | None = None) -> Result:
  """Синхронная проверка. Возвращает 'exists' | 'not_found' | 'error'."""
  try:
    with httpx.Client() as client:
      headers = {"Authorization": f"Bearer {token}"} if token else {}
      response = client.get(
        f"{settings.FOCUS_SERVICE_URL}/api/users/{focus_user_id}",
        headers=headers,
        timeout=5.0,
      )
      if response.status_code == 200:
        return "exists"
      if response.status_code == 404:
        return "not_found"
      return "error"
  except httpx.RequestError:
    return "error"
