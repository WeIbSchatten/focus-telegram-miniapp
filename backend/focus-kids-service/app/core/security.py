import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.config.settings import settings

security = HTTPBearer()


def decode_jwt_token(token: str) -> dict:
  try:
    payload = jwt.decode(token, settings.APP_JWT_SECRET, algorithms=["HS256"])
    return payload
  except jwt.ExpiredSignatureError:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Token expired"
    )
  except jwt.InvalidTokenError:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid token"
    )


async def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
  token = credentials.credentials
  payload = decode_jwt_token(token)
  return payload
