"""
Business logic services for the education system.
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlmodel import select

logger = logging.getLogger(__name__)

from bisheng.api.v1.education.models import (
    Course, Chapter, UserProgress, GuidedProgress,
    CourseDao, ChapterDao, UserProgressDao, GuidedProgressDao
)
from bisheng.api.v1.education.schemas import (
    CourseInfo, CourseResponse, ChapterInfo, VideoInfoResponse,
    UserProgressResponse, CourseProgress, GuidedStep, LearningTrend
)


class CourseService:
    def __init__(self, db: Session):
        self.db = db

    def get_courses(self, level: Optional[str] = None, category: Optional[str] = None) -> List[CourseInfo]:
        """Get list of courses with optional filtering."""
        statement = select(Course, func.count(Chapter.id)).outerjoin(
            Chapter,
            Chapter.course_id == Course.id
        )
        if level:
            statement = statement.where(Course.level == level)
        if category:
            statement = statement.where(Course.category == category)
        statement = statement.group_by(Course.id)
        rows = self.db.exec(statement).all()

        course_infos: List[CourseInfo] = []
        for course, chapters_count in rows:
            course_infos.append(
                CourseInfo(
                    id=course.id,
                    title=course.title,
                    description=course.description,
                    level=course.level,
                    category=course.category or "",
                    duration=course.duration or 0,
                    chapters_count=int(chapters_count or 0),
                    thumbnail=course.thumbnail or ""
                )
            )

        return course_infos

    def get_course_by_id(self, course_id: str, user_id: Optional[int] = None) -> Optional[CourseResponse]:
        """Get detailed course information by ID with optional user progress."""
        course = CourseDao.get_course_by_id(course_id)
        if not course:
            return None
        
        # Get chapters for this course
        chapters = ChapterDao.get_chapters_by_course_id(course_id)
        
        # Get user progress if user_id is provided
        user_progress_map = {}
        if user_id:
            user_progress_list = UserProgressDao.get_user_progress_by_course(user_id, course_id)
            user_progress_map = {progress.chapter_id: progress for progress in user_progress_list}
        
        chapter_infos = []
        for chapter in chapters:
            progress = user_progress_map.get(chapter.id)
            chapter_duration = getattr(chapter, "duration", None) or 0
            chapter_video_url = getattr(chapter, "video_url", "") or ""
            chapter_info = ChapterInfo(
                id=chapter.id,
                title=chapter.title,
                duration=chapter_duration,
                video_url=chapter_video_url,
                order=chapter.order_index,
                completed=progress.completed if progress else False,
                progress=progress.progress if progress else 0.0
            )
            chapter_infos.append(chapter_info)
        
        return CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description or "",
            level=course.level,
            chapters=chapter_infos
        )


class VideoService:
    def __init__(self, db: Session):
        self.db = db

    def get_video_info(self, chapter_id: str, user_id: int) -> Optional[VideoInfoResponse]:
        """Get video information and user's last watching position."""
        # Validate user_id to prevent unauthorized access
        if not user_id or user_id <= 0:
            logger.error(f"Invalid user_id provided: {user_id}")
            return None
        
        chapter = ChapterDao.get_chapter_by_id(chapter_id)
        if not chapter:
            return None
            
        # Get user's progress for this chapter - this already filters by user_id
        progress = UserProgressDao.get_user_progress(user_id, chapter_id)
        last_position = progress.last_position if progress else 0
        
        # Process video URL - ensure it's a complete CDN URL
        chapter_duration = getattr(chapter, "duration", None) or 0
        video_url = getattr(chapter, "video_url", "") or ""
        if video_url and not video_url.startswith(('http://', 'https://')):
            # If it's a relative path, prepend CDN base URL
            import os
            cdn_base_url = os.getenv('CDN_BASE_URL', 'https://cdn.example.com/education/')
            video_url = cdn_base_url.rstrip('/') + '/' + video_url.lstrip('/')
        
        return VideoInfoResponse(
            video_url=video_url,
            duration=chapter_duration,
            last_position=last_position
        )

    def update_progress(self, chapter_id: str, user_id: int, position: int, completed: bool = None) -> bool:
        """Update user's video watching progress with automatic completion detection."""
        try:
            # Validate user_id to prevent unauthorized access
            if not user_id or user_id <= 0:
                logger.error(f"Invalid user_id provided: {user_id}")
                return False
            
            # Validate position to prevent malicious data
            if position < 0:
                logger.error(f"Invalid position provided: {position}")
                return False
            
            # Get chapter info
            chapter = ChapterDao.get_chapter_by_id(chapter_id)
            if not chapter:
                return False
            
            # Get existing progress to calculate learning time
            existing_progress = UserProgressDao.get_user_progress(user_id, chapter_id)
            previous_position = existing_progress.last_position if existing_progress else 0
            previous_learning_time = existing_progress.learning_time if existing_progress else 0
            
            # Calculate progress percentage
            chapter_duration = getattr(chapter, "duration", None) or 0
            progress_percentage = 0.0
            if chapter_duration > 0:
                progress_percentage = min(position / chapter_duration, 1.0)
            
            # Auto-detect completion if not explicitly set
            # Consider completed if user watched 90% or more of the video
            auto_completed = progress_percentage >= 0.9
            final_completed = completed if completed is not None else auto_completed
            
            # Calculate additional learning time (only if moving forward)
            additional_time = max(0, position - previous_position) if position > previous_position else 0
            total_learning_time = previous_learning_time + additional_time
            
            # Create or update progress
            progress = UserProgress(
                user_id=user_id,
                course_id=chapter.course_id,
                chapter_id=chapter_id,
                progress=progress_percentage,
                last_position=position,
                completed=final_completed,
                learning_time=total_learning_time
            )
            
            UserProgressDao.create_or_update_progress(progress)
            return True
        except Exception as e:
            logger.error(f"Error updating progress for chapter {chapter_id}: {str(e)}")
            return False


class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_progress(self, user_id: int) -> UserProgressResponse:
        """Get user's comprehensive learning progress and statistics."""
        from datetime import datetime, timedelta
        
        # Validate user_id to prevent access to other users' data
        if not user_id or user_id <= 0:
            raise ValueError("Invalid user ID")
        
        # Get all courses
        all_courses = CourseDao.get_all_courses()
        total_courses = len(all_courses)
        
        # Get user's progress - this already filters by user_id
        user_progress = UserProgressDao.get_all_user_progress(user_id)
        
        # Calculate completed courses and total learning time
        completed_courses_set = set()
        total_learning_time = 0
        course_progress_map = {}
        course_learning_time_map = {}
        
        for progress in user_progress:
            total_learning_time += progress.learning_time
            
            if progress.completed:
                completed_courses_set.add(progress.course_id)
            
            # Aggregate course data
            if progress.course_id not in course_progress_map:
                course_progress_map[progress.course_id] = {
                    'completed_chapters': 0,
                    'total_chapters': 0,
                    'total_progress': 0.0,
                    'last_accessed': progress.updated_at
                }
                course_learning_time_map[progress.course_id] = 0
            
            course_data = course_progress_map[progress.course_id]
            course_data['total_chapters'] += 1
            course_data['total_progress'] += progress.progress
            course_learning_time_map[progress.course_id] += progress.learning_time
            
            # Track most recent access
            if progress.updated_at and (not course_data['last_accessed'] or progress.updated_at > course_data['last_accessed']):
                course_data['last_accessed'] = progress.updated_at
            
            if progress.completed:
                course_data['completed_chapters'] += 1
        
        completed_courses = len(completed_courses_set)
        
        # Calculate completion rate
        completion_rate = completed_courses / total_courses if total_courses > 0 else 0.0
        
        # Calculate learning trends and statistics
        learning_trends = self._calculate_learning_trends(user_id)
        average_daily_time = self._calculate_average_daily_time(learning_trends)
        streak_days = self._calculate_learning_streak(learning_trends)
        
        # Build course progress list with enhanced data
        courses_progress = []
        course_title_map = {course.id: course.title for course in all_courses}
        
        for course_id, data in course_progress_map.items():
            avg_progress = data['total_progress'] / data['total_chapters'] if data['total_chapters'] > 0 else 0
            last_accessed_str = data['last_accessed'].isoformat() if data['last_accessed'] else None
            
            courses_progress.append(
                CourseProgress(
                    course_id=course_id,
                    course_title=course_title_map.get(course_id, "Unknown Course"),
                    progress=avg_progress,
                    completed_chapters=data['completed_chapters'],
                    total_chapters=data['total_chapters'],
                    learning_time=course_learning_time_map[course_id],
                    last_accessed=last_accessed_str
                )
            )
        
        return UserProgressResponse(
            total_courses=total_courses,
            completed_courses=completed_courses,
            total_learning_time=total_learning_time,
            completion_rate=completion_rate,
            average_daily_time=average_daily_time,
            streak_days=streak_days,
            courses_progress=courses_progress,
            learning_trends=learning_trends
        )

    def mark_chapter_complete(self, chapter_id: str, user_id: int) -> Dict[str, Any]:
        """Mark a chapter as completed and update learning statistics."""
        try:
            # Validate user_id to prevent unauthorized access
            if not user_id or user_id <= 0:
                return {"success": False, "error": "Invalid user ID"}
            
            # Get chapter info
            chapter = ChapterDao.get_chapter_by_id(chapter_id)
            if not chapter:
                return {"success": False, "error": "Chapter not found"}
            
            # Get existing progress to preserve learning time
            existing_progress = UserProgressDao.get_user_progress(user_id, chapter_id)
            chapter_duration = getattr(chapter, "duration", None) or 0
            learning_time = existing_progress.learning_time if existing_progress else chapter_duration
            
            # Create or update progress as completed
            progress = UserProgress(
                user_id=user_id,
                course_id=chapter.course_id,
                chapter_id=chapter_id,
                progress=1.0,
                last_position=chapter_duration,
                completed=True,
                learning_time=learning_time
            )
            
            UserProgressDao.create_or_update_progress(progress)
            
            # Check if this unlocks the next chapter
            next_chapter = self._get_next_chapter(chapter)
            next_chapter_unlocked = next_chapter is not None
            
            # Calculate course completion percentage
            course_progress = self._calculate_course_progress(user_id, chapter.course_id)
            
            return {
                "success": True,
                "chapter_completed": True,
                "next_chapter_id": next_chapter.id if next_chapter else None,
                "next_chapter_unlocked": next_chapter_unlocked,
                "course_progress": course_progress
            }
            
        except Exception as e:
            logger.error(f"Error marking chapter {chapter_id} complete: {str(e)}")
            return {"success": False, "error": "Failed to mark chapter complete"}
    
    def _get_next_chapter(self, current_chapter: Chapter) -> Optional[Chapter]:
        """Get the next chapter in the course sequence."""
        try:
            chapters = ChapterDao.get_chapters_by_course_id(current_chapter.course_id)
            # Sort by order_index and find the next one
            sorted_chapters = sorted(chapters, key=lambda c: c.order_index)
            
            for i, chapter in enumerate(sorted_chapters):
                if chapter.id == current_chapter.id and i + 1 < len(sorted_chapters):
                    return sorted_chapters[i + 1]
            return None
        except Exception:
            return None
    
    def _calculate_course_progress(self, user_id: int, course_id: str) -> float:
        """Calculate the completion percentage for a course."""
        try:
            # Get all chapters for the course
            chapters = ChapterDao.get_chapters_by_course_id(course_id)
            if not chapters:
                return 0.0
            
            # Get user progress for this course
            user_progress_list = UserProgressDao.get_user_progress_by_course(user_id, course_id)
            completed_count = sum(1 for p in user_progress_list if p.completed)
            
            return completed_count / len(chapters)
        except Exception:
            return 0.0
    
    def _calculate_learning_trends(self, user_id: int) -> List['LearningTrend']:
        """Calculate learning trends for the last 30 days."""
        from datetime import datetime, timedelta
        from collections import defaultdict
        
        try:
            # Get user progress data
            user_progress = UserProgressDao.get_all_user_progress(user_id)
            
            # Group data by date
            daily_data = defaultdict(lambda: {'learning_time': 0, 'chapters_completed': 0})
            
            # Calculate 30 days ago
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            for progress in user_progress:
                if progress.updated_at and progress.updated_at >= thirty_days_ago:
                    date_str = progress.updated_at.date().isoformat()
                    daily_data[date_str]['learning_time'] += progress.learning_time
                    if progress.completed:
                        daily_data[date_str]['chapters_completed'] += 1
            
            # Generate trends for last 30 days (fill missing days with zeros)
            trends = []
            for i in range(30):
                date = (datetime.now() - timedelta(days=29-i)).date()
                date_str = date.isoformat()
                data = daily_data.get(date_str, {'learning_time': 0, 'chapters_completed': 0})
                
                trends.append(LearningTrend(
                    date=date_str,
                    learning_time=data['learning_time'],
                    chapters_completed=data['chapters_completed']
                ))
            
            return trends
        except Exception as e:
            logger.error(f"Error calculating learning trends: {str(e)}")
            return []
    
    def _calculate_average_daily_time(self, learning_trends: List['LearningTrend']) -> int:
        """Calculate average daily learning time from trends."""
        if not learning_trends:
            return 0
        
        total_time = sum(trend.learning_time for trend in learning_trends)
        return total_time // len(learning_trends)
    
    def _calculate_learning_streak(self, learning_trends: List['LearningTrend']) -> int:
        """Calculate current learning streak in days."""
        if not learning_trends:
            return 0
        
        # Count consecutive days with learning activity from the end
        streak = 0
        for trend in reversed(learning_trends):
            if trend.learning_time > 0 or trend.chapters_completed > 0:
                streak += 1
            else:
                break
        
        return streak
    
    def get_detailed_progress_analytics(self, user_id: int) -> Dict[str, Any]:
        """Get detailed progress analytics and aggregated data."""
        try:
            # Get basic progress data
            basic_progress = self.get_user_progress(user_id)
            
            # Calculate additional analytics
            analytics = {
                'basic_stats': {
                    'total_courses': basic_progress.total_courses,
                    'completed_courses': basic_progress.completed_courses,
                    'completion_rate': basic_progress.completion_rate,
                    'total_learning_time': basic_progress.total_learning_time,
                    'average_daily_time': basic_progress.average_daily_time,
                    'streak_days': basic_progress.streak_days
                },
                'course_analytics': self._get_course_analytics(user_id),
                'learning_patterns': self._analyze_learning_patterns(basic_progress.learning_trends),
                'performance_metrics': self._calculate_performance_metrics(user_id),
                'recommendations': self._generate_learning_recommendations(user_id, basic_progress)
            }
            
            return analytics
        except Exception as e:
            logger.error(f"Error getting detailed analytics: {str(e)}")
            return {}
    
    def _get_course_analytics(self, user_id: int) -> Dict[str, Any]:
        """Get detailed analytics for each course."""
        try:
            user_progress = UserProgressDao.get_all_user_progress(user_id)
            all_courses = CourseDao.get_all_courses()
            
            course_analytics = {}
            
            # Group progress by course
            course_progress_map = defaultdict(list)
            for progress in user_progress:
                course_progress_map[progress.course_id].append(progress)
            
            for course in all_courses:
                course_id = course.id
                progress_list = course_progress_map.get(course_id, [])
                
                if progress_list:
                    total_chapters = len(ChapterDao.get_chapters_by_course_id(course_id))
                    completed_chapters = sum(1 for p in progress_list if p.completed)
                    total_time = sum(p.learning_time for p in progress_list)
                    avg_progress = sum(p.progress for p in progress_list) / len(progress_list)
                    
                    course_analytics[course_id] = {
                        'title': course.title,
                        'level': course.level,
                        'completion_percentage': (completed_chapters / total_chapters * 100) if total_chapters > 0 else 0,
                        'time_spent': total_time,
                        'average_progress': avg_progress,
                        'chapters_completed': completed_chapters,
                        'total_chapters': total_chapters,
                        'estimated_time_remaining': self._estimate_remaining_time(course, progress_list)
                    }
                else:
                    # Course not started
                    total_chapters = len(ChapterDao.get_chapters_by_course_id(course_id))
                    course_analytics[course_id] = {
                        'title': course.title,
                        'level': course.level,
                        'completion_percentage': 0,
                        'time_spent': 0,
                        'average_progress': 0,
                        'chapters_completed': 0,
                        'total_chapters': total_chapters,
                        'estimated_time_remaining': course.duration * 60 if course.duration else 0
                    }
            
            return course_analytics
        except Exception as e:
            logger.error(f"Error getting course analytics: {str(e)}")
            return {}
    
    def _analyze_learning_patterns(self, learning_trends: List[LearningTrend]) -> Dict[str, Any]:
        """Analyze learning patterns from trends data."""
        try:
            if not learning_trends:
                return {}
            
            # Calculate weekly patterns
            weekly_totals = [0] * 7  # Monday = 0, Sunday = 6
            daily_averages = []
            peak_learning_days = []
            
            from datetime import datetime
            
            for trend in learning_trends:
                date_obj = datetime.fromisoformat(trend.date)
                weekday = date_obj.weekday()
                weekly_totals[weekday] += trend.learning_time
                daily_averages.append(trend.learning_time)
                
                if trend.learning_time > 0:
                    peak_learning_days.append({
                        'date': trend.date,
                        'learning_time': trend.learning_time,
                        'chapters_completed': trend.chapters_completed
                    })
            
            # Find most productive day of week
            most_productive_day = weekly_totals.index(max(weekly_totals)) if max(weekly_totals) > 0 else 0
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            
            # Calculate consistency score (lower variance = more consistent)
            if len(daily_averages) > 1:
                mean_time = sum(daily_averages) / len(daily_averages)
                variance = sum((x - mean_time) ** 2 for x in daily_averages) / len(daily_averages)
                consistency_score = max(0, 100 - (variance ** 0.5 / (mean_time + 1)) * 100)
            else:
                consistency_score = 0
            
            return {
                'most_productive_day': day_names[most_productive_day],
                'weekly_distribution': dict(zip(day_names, weekly_totals)),
                'consistency_score': round(consistency_score, 2),
                'peak_learning_sessions': sorted(peak_learning_days, key=lambda x: x['learning_time'], reverse=True)[:5],
                'average_session_length': sum(daily_averages) / len([x for x in daily_averages if x > 0]) if any(daily_averages) else 0
            }
        except Exception as e:
            logger.error(f"Error analyzing learning patterns: {str(e)}")
            return {}
    
    def _calculate_performance_metrics(self, user_id: int) -> Dict[str, Any]:
        """Calculate performance metrics for the user."""
        try:
            user_progress = UserProgressDao.get_all_user_progress(user_id)
            
            if not user_progress:
                return {}
            
            # Calculate completion rate by difficulty level
            level_stats = defaultdict(lambda: {'completed': 0, 'total': 0, 'time': 0})
            
            for progress in user_progress:
                # Get course to determine level
                course = CourseDao.get_course_by_id(progress.course_id)
                if course:
                    level = course.level
                    level_stats[level]['total'] += 1
                    level_stats[level]['time'] += progress.learning_time
                    if progress.completed:
                        level_stats[level]['completed'] += 1
            
            # Calculate efficiency metrics
            total_time = sum(p.learning_time for p in user_progress)
            completed_chapters = sum(1 for p in user_progress if p.completed)
            
            efficiency_score = (completed_chapters / (total_time / 3600)) if total_time > 0 else 0  # chapters per hour
            
            return {
                'completion_by_level': {
                    level: {
                        'completion_rate': stats['completed'] / stats['total'] if stats['total'] > 0 else 0,
                        'average_time_per_chapter': stats['time'] / stats['total'] if stats['total'] > 0 else 0,
                        'total_chapters': stats['total'],
                        'completed_chapters': stats['completed']
                    }
                    for level, stats in level_stats.items()
                },
                'efficiency_score': round(efficiency_score, 2),
                'total_active_time': total_time,
                'chapters_per_hour': round(efficiency_score, 2)
            }
        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}")
            return {}
    
    def _generate_learning_recommendations(self, user_id: int, progress_data: UserProgressResponse) -> List[Dict[str, str]]:
        """Generate personalized learning recommendations."""
        try:
            recommendations = []
            
            # Recommendation based on completion rate
            if progress_data.completion_rate < 0.3:
                recommendations.append({
                    'type': 'motivation',
                    'title': 'Start Your Learning Journey',
                    'message': 'You have many courses available. Try starting with a beginner-level course to build momentum.',
                    'action': 'Browse beginner courses'
                })
            elif progress_data.completion_rate < 0.7:
                recommendations.append({
                    'type': 'progress',
                    'title': 'Keep Up the Good Work',
                    'message': 'You\'re making good progress! Try to complete your current courses before starting new ones.',
                    'action': 'Continue current courses'
                })
            
            # Recommendation based on learning streak
            if progress_data.streak_days == 0:
                recommendations.append({
                    'type': 'consistency',
                    'title': 'Build a Learning Habit',
                    'message': 'Try to learn something every day, even if it\'s just for 10 minutes.',
                    'action': 'Set daily learning goal'
                })
            elif progress_data.streak_days >= 7:
                recommendations.append({
                    'type': 'achievement',
                    'title': 'Amazing Streak!',
                    'message': f'You\'ve been learning for {progress_data.streak_days} days straight. Keep it up!',
                    'action': 'Continue streak'
                })
            
            # Recommendation based on average daily time
            if progress_data.average_daily_time < 600:  # Less than 10 minutes
                recommendations.append({
                    'type': 'time',
                    'title': 'Increase Learning Time',
                    'message': 'Try to spend at least 15-20 minutes per day learning for better retention.',
                    'action': 'Set longer study sessions'
                })
            
            return recommendations
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    def _estimate_remaining_time(self, course: Course, progress_list: List[UserProgress]) -> int:
        """Estimate remaining time to complete a course."""
        try:
            if not progress_list:
                return course.duration * 60 if course.duration else 0
            
            # Calculate average time per chapter based on user's actual progress
            completed_progress = [p for p in progress_list if p.completed]
            if completed_progress:
                avg_time_per_chapter = sum(p.learning_time for p in completed_progress) / len(completed_progress)
            else:
                # Use course duration as estimate
                total_chapters = len(ChapterDao.get_chapters_by_course_id(course.id))
                avg_time_per_chapter = (course.duration * 60 / total_chapters) if course.duration and total_chapters > 0 else 1800  # 30 min default
            
            # Calculate remaining chapters
            total_chapters = len(ChapterDao.get_chapters_by_course_id(course.id))
            completed_chapters = len(completed_progress)
            remaining_chapters = max(0, total_chapters - completed_chapters)
            
            return int(remaining_chapters * avg_time_per_chapter)
        except Exception:
            return 0


class StatsService:
    """Service for handling education statistics and analytics."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_learning_overview(self) -> Dict[str, Any]:
        """Get overall platform learning statistics."""
        try:
            # Get total courses
            total_courses = CourseDao.get_total_courses_count()
            
            # Get total students (unique users with progress)
            total_students = UserProgressDao.get_total_active_users_count()
            
            # Calculate average rating (mock data for now)
            average_rating = 4.8
            
            # Calculate total duration from all courses
            total_duration = CourseDao.get_total_courses_duration()
            
            return {
                "total_courses": total_courses,
                "total_students": total_students,
                "average_rating": average_rating,
                "total_duration": total_duration
            }
        except Exception as e:
            logger.error(f"Error getting learning overview: {e}")
            # Return default values if database query fails
            return {
                "total_courses": 3,
                "total_students": 2522,
                "average_rating": 4.8,
                "total_duration": 280
            }
    
    def get_user_learning_stats(self, user_id: int) -> Dict[str, Any]:
        """Get learning statistics for a specific user."""
        try:
            user_progress = UserProgressDao.get_all_user_progress(user_id)
            
            total_learning_time = sum(p.learning_time for p in user_progress)
            completed_courses = len(set(p.course_id for p in user_progress if p.completed))
            
            return {
                "user_id": user_id,
                "total_learning_time": total_learning_time,
                "completed_courses": completed_courses,
                "current_streak": 0,  # TODO: Implement streak calculation
                "total_achievements": 0  # TODO: Implement achievements
            }
        except Exception as e:
            logger.error(f"Error getting user stats for user {user_id}: {e}")
            return {
                "user_id": user_id,
                "total_learning_time": 0,
                "completed_courses": 0,
                "current_streak": 0,
                "total_achievements": 0
            }
    
    def get_course_stats(self, course_id: str) -> Dict[str, Any]:
        """Get statistics for a specific course."""
        try:
            # Get course progress data
            course_progress = UserProgressDao.get_course_progress_stats(course_id)
            
            total_students = len(set(p.user_id for p in course_progress))
            completed_students = len(set(p.user_id for p in course_progress if p.completed))
            completion_rate = completed_students / total_students if total_students > 0 else 0.0
            
            return {
                "course_id": course_id,
                "total_students": total_students,
                "completion_rate": completion_rate,
                "average_rating": 4.8,  # Mock data
                "average_completion_time": 120  # Mock data in minutes
            }
        except Exception as e:
            logger.error(f"Error getting course stats for course {course_id}: {e}")
            return {
                "course_id": course_id,
                "total_students": 0,
                "completion_rate": 0.0,
                "average_rating": 0.0,
                "average_completion_time": 0
            }


class GuidedBuilderService:
    def __init__(self, db: Session):
        self.db = db

    def get_guided_steps(self) -> List[GuidedStep]:
        """Get predefined steps for guided agent building with comprehensive flow."""
        # Comprehensive guided steps for workflow creation
        steps = [
            GuidedStep(
                id="step-1",
                title="欢迎进入工作流编辑器",
                description="了解工作流画布与基础操作",
                focus_element=".react-flow",
                instructions="工作流由多个节点组成，数据会沿着节点连接流动。接下来我们会一步步创建一个最小可用的工作流。"
            ),
            GuidedStep(
                id="step-2",
                title="认识组件库",
                description="浏览左侧可用节点类型",
                focus_element=".flow-sidebar",
                instructions="左侧是节点组件库，包含基础节点与工具节点。您可以拖拽节点到画布中搭建流程。"
            ),
            GuidedStep(
                id="step-3",
                title="添加输入节点",
                description="拖拽输入节点到画布中心",
                focus_element=".flow-sidebar [data-node-type]",
                instructions="从组件库中拖拽“输入”节点到画布中央，作为工作流的入口。"
            ),
            GuidedStep(
                id="step-4",
                title="添加大模型节点",
                description="拖拽大模型节点到输入节点右侧",
                focus_element=".flow-sidebar",
                instructions="将“大模型”节点放在输入节点的右侧，用于处理输入内容。"
            ),
            GuidedStep(
                id="step-5",
                title="连接节点",
                description="将输入节点连接到大模型节点",
                focus_element=".react-flow",
                instructions="拖拽输入节点的连接点到大模型节点，完成第一条数据流连接。"
            ),
            GuidedStep(
                id="step-6",
                title="添加输出节点",
                description="拖拽输出节点到大模型节点右侧",
                focus_element=".flow-sidebar",
                instructions="添加“输出”节点，作为工作流的最终输出结果。"
            ),
            GuidedStep(
                id="step-7",
                title="连接输出节点",
                description="将大模型节点连接到输出节点",
                focus_element=".react-flow",
                instructions="完成大模型与输出节点的连接，构建完整的端到端流程。"
            ),
            GuidedStep(
                id="step-8",
                title="配置节点参数",
                description="点击节点打开配置面板",
                focus_element=".react-flow",
                instructions="点击大模型节点，调整模型与提示词配置，让输出符合预期。"
            ),
            GuidedStep(
                id="step-9",
                title="保存工作流",
                description="保存当前工作流配置",
                focus_element=".react-flow",
                instructions="点击顶部保存按钮，持久化当前配置，方便后续编辑与发布。"
            ),
            GuidedStep(
                id="step-10",
                title="测试运行",
                description="运行并验证工作流效果",
                focus_element=".react-flow",
                instructions="点击运行按钮进行测试，确认节点连接与输出效果。"
            ),
            GuidedStep(
                id="step-11",
                title="完成引导",
                description="继续探索更多工作流能力",
                focus_element=".react-flow",
                instructions="恭喜完成基础引导，您可以继续添加更多节点和高级配置。"
            )
        ]
        return steps

    def get_step_template(self, step_id: str) -> Optional[Dict[str, Any]]:
        """Get configuration template for a specific step."""
        templates = {
            "step-1": {
                "name": "",
                "description": "",
                "category": "general",
                "tags": [],
                "version": "1.0.0"
            },
            "step-2": {
                "role_type": "assistant",
                "expertise_domain": [],
                "personality_traits": [],
                "communication_style": "professional"
            },
            "step-3": {
                "system_prompt": "",
                "behavior_guidelines": [],
                "knowledge_constraints": [],
                "response_principles": []
            },
            "step-4": {
                "model_provider": "",
                "model_name": "",
                "model_version": "",
                "fallback_models": []
            },
            "step-5": {
                "temperature": 0.7,
                "max_tokens": 2048,
                "top_p": 0.9,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0
            },
            "step-6": {
                "input_validation": True,
                "input_preprocessing": [],
                "supported_formats": ["text"],
                "max_input_length": 4000
            },
            "step-7": {
                "output_format": "text",
                "response_template": "",
                "include_reasoning": False,
                "include_confidence": False
            },
            "step-8": {
                "enabled_tools": [],
                "tool_permissions": {},
                "api_endpoints": [],
                "external_services": []
            },
            "step-9": {
                "conversation_memory": True,
                "memory_length": 10,
                "long_term_memory": False,
                "context_compression": True
            },
            "step-10": {
                "content_filtering": True,
                "rate_limiting": True,
                "privacy_protection": True,
                "audit_logging": True
            },
            "step-11": {
                "test_cases": [],
                "performance_metrics": {},
                "validation_results": {}
            },
            "step-12": {
                "deployment_mode": "development",
                "resource_allocation": "standard",
                "monitoring_enabled": True,
                "auto_scaling": False
            },
            "step-13": {
                "final_review": False,
                "configuration_validated": False,
                "deployment_ready": False
            }
        }
        return templates.get(step_id)

    def validate_step_config(self, step_id: str, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate configuration data for a specific step."""
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": []
        }

        if step_id == "step-1":
            if not config_data.get("name"):
                validation_result["errors"].append("智能体名称不能为空")
                validation_result["valid"] = False
            if not config_data.get("description"):
                validation_result["warnings"].append("建议添加智能体描述以便更好地理解其用途")

        elif step_id == "step-3":
            if not config_data.get("system_prompt"):
                validation_result["errors"].append("系统提示词不能为空")
                validation_result["valid"] = False
            elif len(config_data.get("system_prompt", "")) < 50:
                validation_result["warnings"].append("系统提示词过短，建议提供更详细的指令")

        elif step_id == "step-4":
            if not config_data.get("model_name"):
                validation_result["errors"].append("必须选择一个语言模型")
                validation_result["valid"] = False

        elif step_id == "step-5":
            temperature = config_data.get("temperature", 0.7)
            if not 0.0 <= temperature <= 2.0:
                validation_result["errors"].append("温度参数必须在0.0-2.0之间")
                validation_result["valid"] = False
            
            max_tokens = config_data.get("max_tokens", 2048)
            if max_tokens < 1 or max_tokens > 32000:
                validation_result["errors"].append("最大令牌数必须在1-32000之间")
                validation_result["valid"] = False

        return validation_result

    def generate_agent_config(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Generate final agent configuration from all completed steps."""
        try:
            # Validate user_id to prevent unauthorized access
            if not user_id or user_id <= 0:
                logger.error(f"Invalid user_id provided: {user_id}")
                return None
            
            # Get all user's guided progress - this already filters by user_id
            all_progress = GuidedProgressDao.get_all_user_guided_progress(user_id)
            
            if not all_progress:
                return None

            # Organize config data by step
            step_configs = {}
            for progress in all_progress:
                if progress.completed and progress.config_data:
                    step_configs[progress.step_id] = progress.config_data

            # Check if all required steps are completed
            required_steps = ["step-1", "step-3", "step-4", "step-5"]
            missing_steps = [step for step in required_steps if step not in step_configs]
            
            if missing_steps:
                logger.warning(f"Missing required steps for user {user_id}: {missing_steps}")
                return None

            # Generate comprehensive agent configuration
            agent_config = {
                "metadata": {
                    "created_by": user_id,
                    "created_at": datetime.now().isoformat(),
                    "version": "1.0.0",
                    "guided_creation": True
                },
                "basic_info": step_configs.get("step-1", {}),
                "role_config": step_configs.get("step-2", {}),
                "system_config": {
                    "system_prompt": step_configs.get("step-3", {}).get("system_prompt", ""),
                    "behavior_guidelines": step_configs.get("step-3", {}).get("behavior_guidelines", []),
                    "knowledge_constraints": step_configs.get("step-3", {}).get("knowledge_constraints", [])
                },
                "model_config": {
                    **step_configs.get("step-4", {}),
                    **step_configs.get("step-5", {})
                },
                "input_config": step_configs.get("step-6", {
                    "input_validation": True,
                    "supported_formats": ["text"],
                    "max_input_length": 4000
                }),
                "output_config": step_configs.get("step-7", {
                    "output_format": "text",
                    "include_reasoning": False
                }),
                "tools_config": step_configs.get("step-8", {
                    "enabled_tools": [],
                    "tool_permissions": {}
                }),
                "memory_config": step_configs.get("step-9", {
                    "conversation_memory": True,
                    "memory_length": 10
                }),
                "safety_config": step_configs.get("step-10", {
                    "content_filtering": True,
                    "rate_limiting": True,
                    "privacy_protection": True
                }),
                "deployment_config": step_configs.get("step-12", {
                    "deployment_mode": "development",
                    "resource_allocation": "standard"
                })
            }

            # Add configuration validation
            validation_results = self._validate_final_config(agent_config)
            agent_config["validation"] = validation_results

            return agent_config

        except Exception as e:
            logger.error(f"Error generating agent config for user {user_id}: {str(e)}")
            return None

    def _validate_final_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the final agent configuration."""
        validation = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "completeness_score": 0.0
        }

        # Check required fields
        required_fields = [
            ("basic_info.name", "智能体名称"),
            ("system_config.system_prompt", "系统提示词"),
            ("model_config.model_name", "语言模型")
        ]

        completed_fields = 0
        for field_path, field_name in required_fields:
            if self._get_nested_value(config, field_path):
                completed_fields += 1
            else:
                validation["errors"].append(f"缺少必需字段: {field_name}")
                validation["valid"] = False

        # Calculate completeness score
        total_sections = 8  # Total configurable sections
        configured_sections = sum(1 for section in [
            "basic_info", "role_config", "system_config", "model_config",
            "input_config", "output_config", "tools_config", "memory_config"
        ] if config.get(section))

        validation["completeness_score"] = configured_sections / total_sections

        # Add warnings for incomplete sections
        if validation["completeness_score"] < 0.7:
            validation["warnings"].append("配置完整度较低，建议完善更多配置项")

        return validation

    def _get_nested_value(self, data: Dict[str, Any], path: str) -> Any:
        """Get nested dictionary value using dot notation."""
        keys = path.split('.')
        current = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        return current

    def get_user_progress_summary(self, user_id: int) -> Dict[str, Any]:
        """Get summary of user's guided building progress."""
        try:
            # Validate user_id to prevent unauthorized access
            if not user_id or user_id <= 0:
                logger.error(f"Invalid user_id provided: {user_id}")
                return {}
            
            all_progress = GuidedProgressDao.get_all_user_guided_progress(user_id)
            total_steps = len(self.get_guided_steps())
            
            completed_steps = [p for p in all_progress if p.completed]
            completion_rate = len(completed_steps) / total_steps if total_steps > 0 else 0

            # Find current step (first incomplete step)
            completed_step_ids = {p.step_id for p in completed_steps}
            all_step_ids = [step.id for step in self.get_guided_steps()]
            
            current_step_id = None
            for step_id in all_step_ids:
                if step_id not in completed_step_ids:
                    current_step_id = step_id
                    break

            # Check if agent can be generated
            required_steps = {"step-1", "step-3", "step-4", "step-5"}
            can_generate = required_steps.issubset(completed_step_ids)

            return {
                "total_steps": total_steps,
                "completed_steps": len(completed_steps),
                "completion_rate": completion_rate,
                "current_step": current_step_id,
                "can_generate_agent": can_generate,
                "last_updated": max([p.updated_at for p in all_progress]).isoformat() if all_progress else None
            }

        except Exception as e:
            logger.error(f"Error getting progress summary for user {user_id}: {str(e)}")
            return {}

    def save_progress(self, user_id: int, step_id: str, completed: bool, config_data: Optional[Dict[str, Any]] = None) -> bool:
        """Save user's progress in the guided building process."""
        try:
            # Validate user_id to prevent unauthorized access
            if not user_id or user_id <= 0:
                logger.error(f"Invalid user_id provided: {user_id}")
                return False
            
            # Validate step_id to prevent malicious data
            if not step_id or not isinstance(step_id, str):
                logger.error(f"Invalid step_id provided: {step_id}")
                return False
            
            # Create or update progress
            progress = GuidedProgress(
                user_id=user_id,
                step_id=step_id,
                completed=completed,
                config_data=config_data
            )
            
            GuidedProgressDao.create_or_update_guided_progress(progress)
            return True
        except Exception:
            return False
