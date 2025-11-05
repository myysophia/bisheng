"""
Pydantic schemas for the education system API.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


# Course related schemas
class ChapterInfo(BaseModel):
    # 临时改为int类型以匹配数据库实际结构
    id: int
    title: str
    duration: int
    video_url: str
    order: int
    completed: bool = False
    progress: float = 0.0


class CourseInfo(BaseModel):
    # 临时改为int类型以匹配数据库实际结构
    id: int
    title: str
    description: str
    level: str
    category: str
    duration: int
    chapters_count: int
    thumbnail: str


class CourseResponse(BaseModel):
    # 临时改为int类型以匹配数据库实际结构
    id: int
    title: str
    description: str
    level: str
    chapters: List[ChapterInfo]


class CourseListResponse(BaseModel):
    courses: List[CourseInfo]
    total: int


# Video related schemas
class VideoInfoResponse(BaseModel):
    video_url: str
    duration: int
    last_position: int


# Statistics related schemas
class LearningStatsResponse(BaseModel):
    total_courses: int
    total_students: int
    average_rating: float
    total_duration: int


class UserStatsResponse(BaseModel):
    user_id: int
    total_learning_time: int
    completed_courses: int
    current_streak: int
    total_achievements: int


class CourseStatsResponse(BaseModel):
    # 临时改为int类型以匹配数据库实际结构
    course_id: int
    total_students: int
    completion_rate: float
    average_rating: float
    average_completion_time: int


class ProgressUpdateRequest(BaseModel):
    position: int
    completed: Optional[bool] = None  # Auto-detect if not provided


# Progress related schemas
class CourseProgress(BaseModel):
    # 临时改为int类型以匹配数据库实际结构
    course_id: int
    course_title: str
    progress: float
    completed_chapters: int
    total_chapters: int
    learning_time: int  # Time spent on this course in seconds
    last_accessed: Optional[str] = None  # ISO datetime string


class LearningTrend(BaseModel):
    date: str  # ISO date string (YYYY-MM-DD)
    learning_time: int  # Total learning time for that day in seconds
    chapters_completed: int  # Number of chapters completed that day


class UserProgressResponse(BaseModel):
    total_courses: int
    completed_courses: int
    total_learning_time: int
    completion_rate: float  # Overall completion percentage (0-1)
    average_daily_time: int  # Average daily learning time in seconds
    streak_days: int  # Current learning streak in days
    courses_progress: List[CourseProgress]
    learning_trends: List[LearningTrend]  # Last 30 days of learning data


# Guided builder schemas
class GuidedStep(BaseModel):
    id: str
    title: str
    description: str
    focus_element: str
    instructions: str


class GuidedStepsResponse(BaseModel):
    steps: List[GuidedStep]


class GuidedProgressRequest(BaseModel):
    step_id: str
    completed: bool
    config_data: Optional[Dict[str, Any]] = None


class StepTemplateResponse(BaseModel):
    template: Dict[str, Any]


class StepValidationResponse(BaseModel):
    valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]


class ProgressSummaryResponse(BaseModel):
    total_steps: int
    completed_steps: int
    completion_rate: float
    current_step: Optional[str]
    can_generate_agent: bool
    last_updated: Optional[str]


class AgentConfigResponse(BaseModel):
    agent_config: Dict[str, Any]