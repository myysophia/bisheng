"""
Learning progress API endpoints for the education system.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from bisheng.api.v1.education.schemas import UserProgressResponse
from bisheng.api.v1.education.services import ProgressService
from bisheng.api.v1.education.auth import get_education_user, EducationAuthMiddleware
from bisheng.database.base import session_getter
from bisheng.api.services.user_service import UserPayload

router = APIRouter(tags=["education"])


@router.get("/progress", response_model=UserProgressResponse)
async def get_user_progress(
    login_user: UserPayload = Depends(get_education_user)
):
    """Get user's overall learning progress and statistics."""
    try:
        # Validate and log access - user can only access their own progress
        EducationAuthMiddleware.validate_and_log_access(login_user, "GET /progress")
        
        with session_getter() as db:
            progress_service = ProgressService(db)
            progress_data = progress_service.get_user_progress(login_user.user_id)
            return progress_data
    except ValueError as e:
        logger.error(f"Validation error in get_user_progress: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error in get_user_progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/progress/analytics")
async def get_progress_analytics(
    login_user: UserPayload = Depends(get_education_user)
):
    """Get detailed progress analytics and learning insights."""
    try:
        # Validate and log access - user can only access their own analytics
        EducationAuthMiddleware.validate_and_log_access(login_user, "GET /progress/analytics")
        
        with session_getter() as db:
            progress_service = ProgressService(db)
            analytics = progress_service.get_detailed_progress_analytics(login_user.user_id)
            return analytics
    except ValueError as e:
        logger.error(f"Validation error in get_progress_analytics: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error getting progress analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get progress analytics")


@router.post("/progress/chapters/{chapter_id}/complete")
async def mark_chapter_complete(
    chapter_id: str,
    login_user: UserPayload = Depends(get_education_user)
):
    """
    Mark a chapter as completed by the user.
    
    Returns information about next chapter unlock and course progress.
    """
    try:
        # Validate and log access - user can only mark their own progress
        EducationAuthMiddleware.validate_and_log_access(login_user, "POST /progress/chapters/{chapter_id}/complete", chapter_id)
        
        # Validate chapter_id parameter
        if not chapter_id or not isinstance(chapter_id, str):
            raise HTTPException(status_code=400, detail="Invalid chapter ID")
        
        with session_getter() as db:
            progress_service = ProgressService(db)
            result = progress_service.mark_chapter_complete(chapter_id, login_user.user_id)
        
            if not result["success"]:
                raise HTTPException(status_code=400, detail=result.get("error", "Failed to mark chapter as complete"))
            
            return {
                "message": "Chapter marked as complete",
                "chapter_completed": result["chapter_completed"],
                "next_chapter_id": result["next_chapter_id"],
                "next_chapter_unlocked": result["next_chapter_unlocked"],
                "course_progress": result["course_progress"]
            }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error in mark_chapter_complete: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error in mark_chapter_complete: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")