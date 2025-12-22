"""
Video service API endpoints for the education system.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from bisheng.api.v1.education.schemas import VideoInfoResponse, ProgressUpdateRequest
from bisheng.api.v1.education.services import VideoService
from bisheng.api.v1.education.auth import get_education_user, EducationAuthMiddleware
from bisheng.database.base import session_getter
from bisheng.api.services.user_service import UserPayload

logger = logging.getLogger(__name__)
router = APIRouter(tags=["education"])


@router.get("/videos/{chapter_id}", response_model=VideoInfoResponse)
async def get_video_info(
    chapter_id: str,
    login_user: UserPayload = Depends(get_education_user)
):
    """
    Get video information and user's last watching position.
    
    Returns:
    - video_url: CDN URL for the video
    - duration: Video duration in seconds
    - last_position: User's last watching position in seconds
    """
    try:
        # 视频资源不按用户 ID 进行资源授权校验，仅记录访问即可
        EducationAuthMiddleware.log_access(login_user, "GET /videos/{chapter_id}", chapter_id)
        
        # Validate chapter_id parameter
        if not chapter_id or not isinstance(chapter_id, str):
            raise HTTPException(status_code=400, detail="Invalid chapter ID")
        
        logger.info(f"Getting video info for chapter {chapter_id}, user {login_user.user_id}")
        
        with session_getter() as db:
            video_service = VideoService(db)
            video_info = video_service.get_video_info(chapter_id, login_user.user_id)
        
            if not video_info:
                logger.warning(f"Video not found for chapter {chapter_id}")
                raise HTTPException(status_code=404, detail="Chapter or video not found")
            
            logger.info(f"Successfully retrieved video info for chapter {chapter_id}")
            return video_info
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error in get_video_info: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error getting video info for chapter {chapter_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/videos/{chapter_id}/progress")
async def update_video_progress(
    chapter_id: str,
    progress_data: ProgressUpdateRequest,
    login_user: UserPayload = Depends(get_education_user)
):
    """
    Update user's video watching progress in real-time.
    
    Automatically calculates completion status based on watch percentage.
    Tracks learning time and supports resume functionality.
    """
    try:
        # 进度写入会在服务层按用户 ID 处理，不使用资源用户 ID 校验
        EducationAuthMiddleware.log_access(login_user, "POST /videos/{chapter_id}/progress", chapter_id)
        
        # Validate input parameters
        if not chapter_id or not isinstance(chapter_id, str):
            raise HTTPException(status_code=400, detail="Invalid chapter ID")
        
        if progress_data.position < 0:
            raise HTTPException(status_code=400, detail="Invalid position value")
        
        logger.info(f"Updating progress for chapter {chapter_id}, user {login_user.user_id}, position {progress_data.position}")
        
        with session_getter() as db:
            video_service = VideoService(db)
            success = video_service.update_progress(
                chapter_id, 
                login_user.user_id, 
                progress_data.position, 
                progress_data.completed
            )
        
            if not success:
                logger.error(f"Failed to update progress for chapter {chapter_id}")
                raise HTTPException(status_code=400, detail="Failed to update progress")
            
            logger.info(f"Successfully updated progress for chapter {chapter_id}")
            return {"message": "Progress updated successfully"}
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error in update_video_progress: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error updating video progress for chapter {chapter_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
