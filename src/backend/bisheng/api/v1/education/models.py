"""
SQLAlchemy models for the education system.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import Column, DateTime, Text, Integer, String, Float, Boolean, ForeignKey, JSON, text
from sqlmodel import Field, select

from bisheng.database.base import session_getter
from bisheng.database.models.base import SQLModelSerializable


class CourseBase(SQLModelSerializable):
    """Base model for Course"""
    # 临时改为int类型以匹配数据库实际结构
    id: int = Field(primary_key=True)
    title: str = Field(max_length=200, index=True)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    level: str = Field(max_length=20, index=True)  # beginner/intermediate/advanced
    category: Optional[str] = Field(default=None, max_length=50, index=True)
    duration: Optional[int] = Field(default=None)  # 总时长(分钟)
    thumbnail: Optional[str] = Field(default=None, max_length=500)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, index=True, server_default=text('CURRENT_TIMESTAMP'))
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))
    )


class Course(CourseBase, table=True):
    """Course model"""
    __tablename__ = "education_courses"


class ChapterBase(SQLModelSerializable):
    """Base model for Chapter - 最小化版本，只包含数据库中存在的字段"""
    # 临时改为int类型以匹配数据库实际结构
    id: int = Field(primary_key=True)
    course_id: int = Field(foreign_key="education_courses.id", index=True)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    order_index: int = Field(index=True)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    )
    
    video_url: Optional[str] = Field(default=None, max_length=500)
    duration: Optional[int] = Field(default=None)  # 时长(秒)


class Chapter(ChapterBase, table=True):
    """Chapter model"""
    __tablename__ = "education_chapters"


class UserProgressBase(SQLModelSerializable):
    """Base model for UserProgress - 匹配实际数据库结构"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)  # 关联现有用户系统
    course_id: int = Field(foreign_key="education_courses.id", index=True)  # 改为int类型
    chapter_id: Optional[int] = Field(default=None, foreign_key="education_chapters.id", index=True)  # 改为int类型，可选
    progress_percentage: Optional[float] = Field(default=0.0, sa_column=Column('progress_percentage', Float))  # 匹配数据库字段名
    progress: Optional[float] = Field(default=0.0)  # 新添加的字段
    last_position: Optional[int] = Field(default=0)  # 视频观看位置(秒)
    completed: Optional[bool] = Field(default=False, index=True)
    learning_time: Optional[int] = Field(default=0)  # 学习时长(秒)
    last_accessed: Optional[datetime] = Field(default=None, sa_column=Column('last_accessed', DateTime))  # 匹配数据库字段名
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))
    )


class UserProgress(UserProgressBase, table=True):
    """UserProgress model"""
    __tablename__ = "education_user_progress"


class GuidedProgressBase(SQLModelSerializable):
    """Base model for GuidedProgress"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    step_id: str = Field(max_length=50, index=True)
    completed: bool = Field(default=False, index=True)
    config_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))
    )


class GuidedProgress(GuidedProgressBase, table=True):
    """GuidedProgress model"""
    __tablename__ = "education_guided_progress"


# DAO classes for database operations
class CourseDao:
    """Data Access Object for Course operations"""
    
    @classmethod
    def get_all_courses(cls, level: Optional[str] = None, category: Optional[str] = None) -> List[Course]:
        """Get all courses with optional filtering"""
        with session_getter() as session:
            statement = select(Course)
            if level:
                statement = statement.where(Course.level == level)
            if category:
                statement = statement.where(Course.category == category)
            return session.exec(statement).all()
    
    @classmethod
    def get_course_by_id(cls, course_id: str) -> Optional[Course]:
        """Get course by ID with chapters"""
        with session_getter() as session:
            statement = select(Course).where(Course.id == course_id)
            return session.exec(statement).first()
    
    @classmethod
    def create_course(cls, course: Course) -> Course:
        """Create a new course"""
        with session_getter() as session:
            session.add(course)
            session.commit()
            session.refresh(course)
            return course
    
    @classmethod
    def get_total_courses_count(cls) -> int:
        """Get total number of courses"""
        with session_getter() as session:
            from sqlalchemy import func
            statement = select(func.count(Course.id))
            return session.exec(statement).first() or 0
    
    @classmethod
    def get_total_courses_duration(cls) -> int:
        """Get total duration of all courses in minutes"""
        with session_getter() as session:
            from sqlalchemy import func
            statement = select(func.sum(Course.duration))
            return session.exec(statement).first() or 0


class ChapterDao:
    """Data Access Object for Chapter operations"""
    
    @classmethod
    def get_chapter_by_id(cls, chapter_id: str) -> Optional[Chapter]:
        """Get chapter by ID"""
        with session_getter() as session:
            statement = select(Chapter).where(Chapter.id == chapter_id)
            return session.exec(statement).first()
    
    @classmethod
    def get_chapters_by_course_id(cls, course_id: str) -> List[Chapter]:
        """Get all chapters for a course"""
        with session_getter() as session:
            statement = select(Chapter).where(Chapter.course_id == course_id).order_by(Chapter.order_index)
            return session.exec(statement).all()
    
    @classmethod
    def create_chapter(cls, chapter: Chapter) -> Chapter:
        """Create a new chapter"""
        with session_getter() as session:
            session.add(chapter)
            session.commit()
            session.refresh(chapter)
            return chapter


class UserProgressDao:
    """Data Access Object for UserProgress operations"""
    
    @classmethod
    def get_user_progress(cls, user_id: int, chapter_id: str) -> Optional[UserProgress]:
        """Get user progress for a specific chapter"""
        # Validate user_id to prevent unauthorized access
        if not user_id or user_id <= 0:
            raise ValueError("Invalid user_id provided")
        
        with session_getter() as session:
            statement = select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.chapter_id == chapter_id
            )
            return session.exec(statement).first()
    
    @classmethod
    def get_user_progress_by_course(cls, user_id: int, course_id: str) -> List[UserProgress]:
        """Get all user progress for a course"""
        # Validate user_id to prevent unauthorized access
        if not user_id or user_id <= 0:
            raise ValueError("Invalid user_id provided")
        
        with session_getter() as session:
            statement = select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.course_id == course_id
            )
            return session.exec(statement).all()
    
    @classmethod
    def get_all_user_progress(cls, user_id: int) -> List[UserProgress]:
        """Get all user progress"""
        # Validate user_id to prevent unauthorized access
        if not user_id or user_id <= 0:
            raise ValueError("Invalid user_id provided")
        
        with session_getter() as session:
            statement = select(UserProgress).where(UserProgress.user_id == user_id)
            return session.exec(statement).all()
    
    @classmethod
    def create_or_update_progress(cls, progress: UserProgress) -> UserProgress:
        """Create or update user progress"""
        # Validate user_id to prevent unauthorized access
        if not progress.user_id or progress.user_id <= 0:
            raise ValueError("Invalid user_id in progress data")
        
        with session_getter() as session:
            # Check if progress already exists
            existing = session.exec(
                select(UserProgress).where(
                    UserProgress.user_id == progress.user_id,
                    UserProgress.chapter_id == progress.chapter_id
                )
            ).first()
            
            if existing:
                # Update existing progress
                existing.progress = progress.progress
                existing.last_position = progress.last_position
                existing.completed = progress.completed
                existing.learning_time = progress.learning_time
                session.add(existing)
                session.commit()
                session.refresh(existing)
                return existing
            else:
                # Create new progress
                session.add(progress)
                session.commit()
                session.refresh(progress)
                return progress
    
    @classmethod
    def get_total_active_users_count(cls) -> int:
        """Get total number of users with learning progress"""
        with session_getter() as session:
            from sqlalchemy import func
            statement = select(func.count(func.distinct(UserProgress.user_id)))
            return session.exec(statement).first() or 0
    
    @classmethod
    def get_course_progress_stats(cls, course_id: str) -> List[UserProgress]:
        """Get all progress records for a specific course"""
        with session_getter() as session:
            statement = select(UserProgress).where(UserProgress.course_id == course_id)
            return session.exec(statement).all()


class GuidedProgressDao:
    """Data Access Object for GuidedProgress operations"""
    
    @classmethod
    def get_user_step_progress(cls, user_id: int, step_id: str) -> Optional[GuidedProgress]:
        """Get user progress for a specific step"""
        # Validate user_id to prevent unauthorized access
        if not user_id or user_id <= 0:
            raise ValueError("Invalid user_id provided")
        
        with session_getter() as session:
            statement = select(GuidedProgress).where(
                GuidedProgress.user_id == user_id,
                GuidedProgress.step_id == step_id
            )
            return session.exec(statement).first()
    
    @classmethod
    def get_all_user_guided_progress(cls, user_id: int) -> List[GuidedProgress]:
        """Get all guided progress for a user"""
        # Validate user_id to prevent unauthorized access
        if not user_id or user_id <= 0:
            raise ValueError("Invalid user_id provided")
        
        with session_getter() as session:
            statement = select(GuidedProgress).where(GuidedProgress.user_id == user_id)
            return session.exec(statement).all()
    
    @classmethod
    def create_or_update_guided_progress(cls, progress: GuidedProgress) -> GuidedProgress:
        """Create or update guided progress"""
        # Validate user_id to prevent unauthorized access
        if not progress.user_id or progress.user_id <= 0:
            raise ValueError("Invalid user_id in progress data")
        
        with session_getter() as session:
            # Check if progress already exists
            existing = session.exec(
                select(GuidedProgress).where(
                    GuidedProgress.user_id == progress.user_id,
                    GuidedProgress.step_id == progress.step_id
                )
            ).first()
            
            if existing:
                # Update existing progress
                existing.completed = progress.completed
                if progress.config_data:
                    existing.config_data = progress.config_data
                session.add(existing)
                session.commit()
                session.refresh(existing)
                return existing
            else:
                # Create new progress
                session.add(progress)
                session.commit()
                session.refresh(progress)
                return progress
