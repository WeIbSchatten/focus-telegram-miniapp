import httpx
from fastapi import Depends, HTTPException, status, Request

from app.core.security import get_current_user
from app.config.settings import settings


async def verify_sense_access(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Проверяет, что пользователь имеет доступ к Focus Sense.
    Делает запрос к Focus сервису для проверки hasSenseAccess.
    """
    user_id = current_user.get("sub") or current_user.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные данные токена",
        )
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.FOCUS_SERVICE_URL}/api/users/{user_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0,
            )
            if response.status_code == 200:
                user_data = response.json()
                if not user_data.get("hasSenseAccess", False):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Доступ к Focus Sense не выдан. Обратитесь к модератору или администратору.",
                    )
                return current_user
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User not found in Focus service",
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Не удалось проверить доступ к Focus Sense",
            )
    except httpx.RequestError as e:
        import logging
        logging.warning("Focus service unavailable: %s. Allowing access (dev mode).", e)
        return current_user


def require_admin_or_moderator(current_user: dict = Depends(get_current_user)) -> dict:
    """Только администратор или модератор могут управлять контентом Sense."""
    role = current_user.get("role")
    if role not in ("admin", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для администратора или модератора",
        )
    return current_user
