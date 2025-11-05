"""
Guided builder API endpoints for the education system.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from bisheng.api.v1.education.schemas import (
    GuidedStepsResponse, GuidedProgressRequest, StepTemplateResponse,
    StepValidationResponse, ProgressSummaryResponse, AgentConfigResponse
)
from bisheng.api.v1.education.services import GuidedBuilderService
from bisheng.api.v1.education.auth import get_education_user, EducationAuthMiddleware
from bisheng.database.base import session_getter
from bisheng.api.services.user_service import UserPayload

router = APIRouter(tags=["education"])


@router.get("/guided-builder/steps", response_model=GuidedStepsResponse)
async def get_guided_steps(
    login_user: UserPayload = Depends(get_education_user)
):
    """Get the predefined steps for guided agent building."""
    EducationAuthMiddleware.log_access(login_user, "GET /guided-builder/steps")
    
    with session_getter() as db:
        guided_service = GuidedBuilderService(db)
        steps = guided_service.get_guided_steps()
        return GuidedStepsResponse(steps=steps)


@router.post("/guided-builder/progress")
async def save_guided_progress(
    progress_data: GuidedProgressRequest,
    login_user: UserPayload = Depends(get_education_user)
):
    """Save user's progress in the guided building process."""
    try:
        # Validate and log access - user can only save their own progress
        EducationAuthMiddleware.validate_and_log_access(login_user, "POST /guided-builder/progress")
        
        # Validate input parameters
        if not progress_data.step_id or not isinstance(progress_data.step_id, str):
            raise HTTPException(status_code=400, detail="Invalid step ID")
        
        with session_getter() as db:
            guided_service = GuidedBuilderService(db)
            success = guided_service.save_progress(
                login_user.user_id,
                progress_data.step_id,
                progress_data.completed,
                progress_data.config_data
            )
            if not success:
                raise HTTPException(status_code=400, detail="Failed to save progress")
            return {"message": "Progress saved successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error in save_guided_progress: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error in save_guided_progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/guided-builder/steps/{step_id}/template", response_model=StepTemplateResponse)
async def get_step_template(
    step_id: str,
    login_user: UserPayload = Depends(get_education_user)
):
    """Get configuration template for a specific guided step."""
    EducationAuthMiddleware.log_access(login_user, "GET /guided-builder/steps/{step_id}/template", step_id)
    
    with session_getter() as db:
        guided_service = GuidedBuilderService(db)
        template = guided_service.get_step_template(step_id)
        if not template:
            raise HTTPException(status_code=404, detail="Step template not found")
        return StepTemplateResponse(template=template)


@router.post("/guided-builder/validate/{step_id}", response_model=StepValidationResponse)
async def validate_step_config(
    step_id: str,
    config_data: Dict[str, Any],
    login_user: UserPayload = Depends(get_education_user)
):
    """Validate configuration data for a specific step."""
    EducationAuthMiddleware.log_access(login_user, "POST /guided-builder/validate/{step_id}", step_id)
    
    with session_getter() as db:
        guided_service = GuidedBuilderService(db)
        validation_result = guided_service.validate_step_config(step_id, config_data)
        return StepValidationResponse(**validation_result)


@router.get("/guided-builder/progress/summary", response_model=ProgressSummaryResponse)
async def get_progress_summary(
    login_user: UserPayload = Depends(get_education_user)
):
    """Get summary of user's guided building progress."""
    try:
        # Validate and log access - user can only access their own progress summary
        EducationAuthMiddleware.validate_and_log_access(login_user, "GET /guided-builder/progress/summary")
        
        with session_getter() as db:
            guided_service = GuidedBuilderService(db)
            summary = guided_service.get_user_progress_summary(login_user.user_id)
            return ProgressSummaryResponse(**summary)
    except ValueError as e:
        logger.error(f"Validation error in get_progress_summary: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error in get_progress_summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/guided-builder/generate-config", response_model=AgentConfigResponse)
async def generate_agent_config(
    login_user: UserPayload = Depends(get_education_user)
):
    """Generate final agent configuration from completed guided steps."""
    try:
        # Validate and log access - user can only generate config from their own progress
        EducationAuthMiddleware.validate_and_log_access(login_user, "POST /guided-builder/generate-config")
        
        with session_getter() as db:
            guided_service = GuidedBuilderService(db)
            config = guided_service.generate_agent_config(login_user.user_id)
            if not config:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot generate config. Please complete required steps first."
                )
            return AgentConfigResponse(agent_config=config)
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error in generate_agent_config: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except Exception as e:
        logger.error(f"Error in generate_agent_config: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")