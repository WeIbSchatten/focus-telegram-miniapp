from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user


def require_admin_or_moderator(current_user: dict = Depends(get_current_user)) -> dict:
    """Только администратор или модератор могут управлять контентом Sense."""
    role = current_user.get("role")
    if role not in ("admin", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для администратора или модератора",
        )
    return current_user
