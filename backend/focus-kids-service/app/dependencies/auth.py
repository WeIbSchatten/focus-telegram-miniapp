import httpx
from fastapi import HTTPException, status, Depends, Request
from typing import Optional

from app.core.security import get_current_user
from app.config.settings import settings


async def verify_kids_access(
  request: Request,
  current_user: dict = Depends(get_current_user)
) -> dict:
  """
  Проверяет, что пользователь имеет доступ к Focus Kids.
  Делает запрос к Focus сервису для проверки hasKidsAccess.
  """
  user_id = current_user.get("sub") or current_user.get("userId")
  if not user_id:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid token payload"
    )

  # Получаем токен из заголовка
  auth_header = request.headers.get("Authorization", "")
  token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(
        f"{settings.FOCUS_SERVICE_URL}/api/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=5.0
      )
      if response.status_code == 200:
        user_data = response.json()
        if not user_data.get("hasKidsAccess", False):
          raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to Focus Kids is not granted. Please contact moderator."
          )
        return current_user
      elif response.status_code == 404:
        raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="User not found in Focus service"
        )
      else:
        raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Could not verify access to Focus Kids"
        )
  except httpx.RequestError as e:
    # Если Focus сервис недоступен, логируем и разрешаем доступ (для dev)
    # В продакшене лучше требовать доступность сервиса
    import logging
    logging.warning(f"Focus service unavailable: {e}. Allowing access (dev mode).")
    return current_user
