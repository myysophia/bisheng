"""
Authentication utilities for the education module.

This module provides authentication middleware and utilities specifically
for the intelligent agent education system, ensuring secure access to
all educational resources and user progress data.
"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi_jwt_auth2 import AuthJWT

from bisheng.api.services.user_service import UserPayload, get_login_user
from bisheng.api.errcode.base import UnAuthorizedError

logger = logging.getLogger(__name__)


async def get_education_user(authorize: AuthJWT = Depends()) -> UserPayload:
    """
    Get authenticated user for education endpoints.
    
    This function ensures that:
    1. User is properly authenticated via JWT
    2. User session is valid and not expired
    3. User has access to education features
    
    Returns:
        UserPayload: Authenticated user information
        
    Raises:
        HTTPException: If user is not authenticated or session is invalid
    """
    try:
        # Use the existing authentication system
        login_user = await get_login_user(authorize)
        
        # Log successful authentication for education access
        logger.info(f"User {login_user.user_id} ({login_user.user_name}) authenticated for education access")
        
        return login_user
        
    except Exception as e:
        logger.warning(f"Authentication failed for education access: {str(e)}")
        raise UnAuthorizedError.http_exception()


def verify_user_access(user_id: int, resource_user_id: int) -> bool:
    """
    Verify that a user can access a specific resource.
    
    Ensures users can only access their own learning progress and data.
    
    Args:
        user_id: ID of the requesting user
        resource_user_id: ID of the user who owns the resource
        
    Returns:
        bool: True if access is allowed, False otherwise
    """
    # Validate input parameters
    if not user_id or not resource_user_id:
        logger.warning(f"Invalid user IDs provided: user_id={user_id}, resource_user_id={resource_user_id}")
        return False
    
    if user_id <= 0 or resource_user_id <= 0:
        logger.warning(f"Invalid user IDs provided: user_id={user_id}, resource_user_id={resource_user_id}")
        return False
    
    return user_id == resource_user_id


def validate_user_id(user_id: int) -> bool:
    """
    Validate that a user ID is valid and safe to use.
    
    Args:
        user_id: The user ID to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return user_id is not None and isinstance(user_id, int) and user_id > 0


def ensure_user_data_access(requesting_user_id: int, data_user_id: int) -> None:
    """
    Ensure that a user can only access their own data.
    
    Raises HTTPException if access is denied.
    
    Args:
        requesting_user_id: ID of the user making the request
        data_user_id: ID of the user who owns the data
        
    Raises:
        HTTPException: If access is denied
    """
    if not validate_user_id(requesting_user_id):
        logger.error(f"Invalid requesting user ID: {requesting_user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not validate_user_id(data_user_id):
        logger.error(f"Invalid data user ID: {data_user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resource user ID"
        )
    
    if not verify_user_access(requesting_user_id, data_user_id):
        logger.warning(
            f"Access denied: User {requesting_user_id} attempted to access data owned by user {data_user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only access your own learning data"
        )


async def get_verified_education_user(
    resource_user_id: Optional[int] = None,
    authorize: AuthJWT = Depends()
) -> UserPayload:
    """
    Get authenticated user and verify access to specific resources.
    
    This function combines authentication with resource access verification
    to ensure users can only access their own educational data.
    
    Args:
        resource_user_id: Optional user ID that owns the resource being accessed
        authorize: JWT authorization dependency
        
    Returns:
        UserPayload: Authenticated user information
        
    Raises:
        HTTPException: If user is not authenticated or doesn't have access
    """
    login_user = await get_education_user(authorize)
    
    # If resource_user_id is specified, verify access
    if resource_user_id is not None:
        if not verify_user_access(login_user.user_id, resource_user_id):
            logger.warning(
                f"User {login_user.user_id} attempted to access resource owned by user {resource_user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only access your own learning data"
            )
    
    return login_user


class EducationAuthMiddleware:
    """
    Authentication middleware class for education endpoints.
    
    Provides centralized authentication logic and logging for the education system.
    """
    
    @staticmethod
    async def authenticate_user(authorize: AuthJWT = Depends()) -> UserPayload:
        """Standard authentication for education endpoints."""
        return await get_education_user(authorize)
    
    @staticmethod
    async def authenticate_and_verify_access(
        resource_user_id: int,
        authorize: AuthJWT = Depends()
    ) -> UserPayload:
        """Authentication with resource access verification."""
        return await get_verified_education_user(resource_user_id, authorize)
    
    @staticmethod
    def log_access(user: UserPayload, endpoint: str, resource_id: Optional[str] = None):
        """Log user access to education resources."""
        resource_info = f" (resource: {resource_id})" if resource_id else ""
        logger.info(f"User {user.user_id} accessed {endpoint}{resource_info}")
    
    @staticmethod
    def log_security_event(user: UserPayload, event_type: str, details: str):
        """Log security-related events."""
        logger.warning(f"SECURITY EVENT - User {user.user_id}: {event_type} - {details}")
    
    @staticmethod
    def validate_and_log_access(user: UserPayload, endpoint: str, resource_user_id: Optional[int] = None):
        """
        Validate user access and log the attempt.
        
        Args:
            user: The authenticated user
            endpoint: The endpoint being accessed
            resource_user_id: Optional user ID that owns the resource
            
        Raises:
            HTTPException: If access is denied
        """
        # Log the access attempt
        EducationAuthMiddleware.log_access(user, endpoint)
        
        # If resource_user_id is provided, verify access
        if resource_user_id is not None:
            try:
                ensure_user_data_access(user.user_id, resource_user_id)
            except HTTPException as e:
                # Log the security violation
                EducationAuthMiddleware.log_security_event(
                    user, 
                    "UNAUTHORIZED_ACCESS_ATTEMPT", 
                    f"Attempted to access resource owned by user {resource_user_id}"
                )
                raise e
    
    @staticmethod
    def ensure_own_data_access(user: UserPayload, data_user_id: int):
        """
        Ensure user can only access their own data.
        
        Args:
            user: The authenticated user
            data_user_id: The user ID that owns the data
            
        Raises:
            HTTPException: If access is denied
        """
        ensure_user_data_access(user.user_id, data_user_id)