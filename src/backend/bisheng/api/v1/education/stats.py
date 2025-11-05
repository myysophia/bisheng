"""
Statistics API endpoints for the education system.
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bisheng.api.v1.education.schemas import LearningStatsResponse
from bisheng.api.v1.education.services import StatsService
from bisheng.api.v1.education.auth import get_education_user, EducationAuthMiddleware
from bisheng.database.base import session_getter
from bisheng.api.services.user_service import UserPayload

logger = logging.getLogger(__name__)
router = APIRouter(tags=["education"])


@router.get("/stats/overview", response_model=LearningStatsResponse)
async def get_learning_stats_overview(
    login_user: UserPayload = Depends(get_education_user)
):
    """Get overall learning statistics and platform metrics."""
    EducationAuthMiddleware.log_access(login_user, "GET /stats/overview")
    
    with session_getter() as db:
        stats_service = StatsService(db)
        stats = stats_service.get_learning_overview()
        return LearningStatsResponse(**stats)


@router.get("/stats/user/{user_id}")
async def get_user_learning_stats(
    user_id: int,
    login_user: UserPayload = Depends(get_education_user)
):
    """Get learning statistics for a specific user."""
    # Ensure user can only access their own stats
    EducationAuthMiddleware.ensure_own_data_access(login_user, user_id)
    
    with session_getter() as db:
        stats_service = StatsService(db)
        stats = stats_service.get_user_learning_stats(user_id)
        return stats


@router.get("/stats/courses/{course_id}")
async def get_course_stats(
    course_id: str,
    login_user: UserPayload = Depends(get_education_user)
):
    """Get statistics for a specific course."""
    EducationAuthMiddleware.log_access(login_user, "GET /stats/courses/{course_id}", course_id)
    
    with session_getter() as db:
        stats_service = StatsService(db)
        stats = stats_service.get_course_stats(course_id)
        return stats