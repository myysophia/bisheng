"""
Course management API endpoints for the education system.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from bisheng.api.v1.education.schemas import CourseResponse, CourseListResponse
from bisheng.api.v1.education.services import CourseService
from bisheng.api.v1.education.auth import get_education_user, EducationAuthMiddleware
from bisheng.api.v1.education.cache import education_cache
from bisheng.api.services.user_service import UserPayload
from bisheng.database.base import session_getter

router = APIRouter(tags=["education"])
COURSE_CACHE_TTL_SECONDS = 60


@router.get("/courses", response_model=CourseListResponse)
async def get_courses(
    level: Optional[str] = Query(None, description="Course difficulty level"),
    category: Optional[str] = Query(None, description="Course category"),
    login_user: UserPayload = Depends(get_education_user)
):
    """Get list of available courses with optional filtering."""
    EducationAuthMiddleware.log_access(login_user, "GET /courses")
    
    cache_key = f"education:courses:{level or 'all'}:{category or 'all'}"
    cached = education_cache.get(cache_key)
    if cached:
        return cached

    with session_getter() as db:
        course_service = CourseService(db)
        courses = course_service.get_courses(level=level, category=category)
        response = CourseListResponse(courses=courses, total=len(courses))
        education_cache.set(cache_key, response, COURSE_CACHE_TTL_SECONDS)
        return response


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course_detail(
    course_id: str,
    request: Request,
    login_user: UserPayload = Depends(get_education_user)
):
    """Get detailed information about a specific course with user progress."""
    EducationAuthMiddleware.log_access(login_user, "GET /courses/{course_id}", course_id)
    
    with session_getter() as db:
        course_service = CourseService(db)
        course = course_service.get_course_by_id(course_id, user_id=login_user.user_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return course
