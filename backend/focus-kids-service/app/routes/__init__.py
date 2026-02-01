from fastapi import APIRouter

from .students import router as students_router
from .teachers import router as teachers_router
from .groups import router as groups_router
from .attendance import router as attendance_router
from .grades import router as grades_router
from .programs import router as programs_router
from .lectures import router as lectures_router
from .homeworks import router as homeworks_router
from .tests import router as tests_router
from .statistics import router as statistics_router


api_router = APIRouter()
api_router.include_router(students_router)
api_router.include_router(teachers_router)
api_router.include_router(groups_router)
api_router.include_router(attendance_router)
api_router.include_router(grades_router)
api_router.include_router(programs_router)
api_router.include_router(lectures_router)
api_router.include_router(homeworks_router)
api_router.include_router(tests_router)
api_router.include_router(statistics_router)

