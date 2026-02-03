from fastapi import APIRouter

from .meditations import router as meditations_router
from .affirmations import router as affirmations_router
from .content import router as content_router

api_router = APIRouter()
api_router.include_router(meditations_router)
api_router.include_router(affirmations_router)
api_router.include_router(content_router)
