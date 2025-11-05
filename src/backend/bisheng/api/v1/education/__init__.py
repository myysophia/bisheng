# Education module for intelligent agent teaching system
from bisheng.api.v1.education.courses import router as courses_router
from bisheng.api.v1.education.videos import router as videos_router
from bisheng.api.v1.education.progress import router as progress_router
from bisheng.api.v1.education.guided_builder import router as guided_builder_router
from bisheng.api.v1.education.stats import router as stats_router

from fastapi import APIRouter

# Create main education router
router = APIRouter(prefix="/education", tags=["education"])

# Include all education sub-routers
router.include_router(courses_router)
router.include_router(videos_router)
router.include_router(progress_router)
router.include_router(guided_builder_router)
router.include_router(stats_router)