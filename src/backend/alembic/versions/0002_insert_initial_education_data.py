"""Insert initial education data

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-20 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Text, Integer

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Insert initial education data."""
    
    # Define table structures for data insertion
    courses_table = table('education_courses',
        column('id', String),
        column('title', String),
        column('description', Text),
        column('level', String),
        column('category', String),
        column('duration', Integer),
        column('thumbnail', String)
    )
    
    chapters_table = table('education_chapters',
        column('id', String),
        column('course_id', String),
        column('title', String),
        column('description', Text),
        column('video_url', String),
        column('duration', Integer),
        column('order_index', Integer)
    )
    
    # Insert sample courses
    op.bulk_insert(courses_table, [
        {
            'id': 'course-001',
            'title': '智能体基础入门',
            'description': '学习智能体的基本概念、原理和应用场景，为后续深入学习打下基础',
            'level': 'beginner',
            'category': 'theory',
            'duration': 120,
            'thumbnail': 'https://cdn.example.com/education/thumbnails/course-001.jpg'
        },
        {
            'id': 'course-002',
            'title': '智能体进阶开发',
            'description': '深入学习智能体的高级功能和开发技巧，包括复杂场景的处理方法',
            'level': 'intermediate',
            'category': 'development',
            'duration': 180,
            'thumbnail': 'https://cdn.example.com/education/thumbnails/course-002.jpg'
        },
        {
            'id': 'course-003',
            'title': '智能体实战应用',
            'description': '通过实际项目案例学习智能体在不同行业的应用实践',
            'level': 'advanced',
            'category': 'practice',
            'duration': 240,
            'thumbnail': 'https://cdn.example.com/education/thumbnails/course-003.jpg'
        }
    ])
    
    # Insert chapters for course-001
    op.bulk_insert(chapters_table, [
        {
            'id': 'chapter-001-01',
            'course_id': 'course-001',
            'title': '第一章：智能体概述',
            'description': '介绍智能体的基本概念和发展历程',
            'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-01.mp4',
            'duration': 1500,
            'order_index': 1
        },
        {
            'id': 'chapter-001-02',
            'course_id': 'course-001',
            'title': '第二章：智能体架构',
            'description': '详细讲解智能体的系统架构和核心组件',
            'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-02.mp4',
            'duration': 1800,
            'order_index': 2
        },
        {
            'id': 'chapter-001-03',
            'course_id': 'course-001',
            'title': '第三章：智能体类型',
            'description': '介绍不同类型的智能体及其特点',
            'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-03.mp4',
            'duration': 1200,
            'order_index': 3
        },
        {
            'id': 'chapter-001-04',
            'course_id': 'course-001',
            'title': '第四章：智能体应用',
            'description': '展示智能体在各个领域的应用案例',
            'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-04.mp4',
            'duration': 2100,
            'order_index': 4
        },
        {
            'id': 'chapter-001-05',
            'course_id': 'course-001',
            'title': '第五章：智能体未来',
            'description': '探讨智能体技术的发展趋势和前景',
            'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-05.mp4',
            'duration': 1500,
            'order_index': 5
        }
    ])
    
    # Insert chapters for course-002
    op.bulk_insert(chapters_table, [
        {
            'id': 'chapter-002-01',
            'course_id': 'course-002',
            'title': '第一章：高级配置',
            'description': '学习智能体的高级配置选项和优化技巧',
            'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-01.mp4',
            'duration': 2400,
            'order_index': 1
        },
        {
            'id': 'chapter-002-02',
            'course_id': 'course-002',
            'title': '第二章：模型集成',
            'description': '掌握多种AI模型的集成和调用方法',
            'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-02.mp4',
            'duration': 2700,
            'order_index': 2
        },
        {
            'id': 'chapter-002-03',
            'course_id': 'course-002',
            'title': '第三章：工具链开发',
            'description': '开发和集成外部工具链提升智能体能力',
            'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-03.mp4',
            'duration': 3000,
            'order_index': 3
        },
        {
            'id': 'chapter-002-04',
            'course_id': 'course-002',
            'title': '第四章：性能优化',
            'description': '优化智能体的响应速度和处理效率',
            'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-04.mp4',
            'duration': 2100,
            'order_index': 4
        }
    ])
    
    # Insert chapters for course-003
    op.bulk_insert(chapters_table, [
        {
            'id': 'chapter-003-01',
            'course_id': 'course-003',
            'title': '第一章：客服机器人',
            'description': '构建智能客服系统的完整实战项目',
            'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-01.mp4',
            'duration': 3600,
            'order_index': 1
        },
        {
            'id': 'chapter-003-02',
            'course_id': 'course-003',
            'title': '第二章：内容生成助手',
            'description': '开发自动化内容创作和编辑助手',
            'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-02.mp4',
            'duration': 4200,
            'order_index': 2
        },
        {
            'id': 'chapter-003-03',
            'course_id': 'course-003',
            'title': '第三章：数据分析智能体',
            'description': '构建专业的数据分析和报告生成系统',
            'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-03.mp4',
            'duration': 3900,
            'order_index': 3
        },
        {
            'id': 'chapter-003-04',
            'course_id': 'course-003',
            'title': '第四章：多智能体协作',
            'description': '实现多个智能体协同工作的复杂系统',
            'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-04.mp4',
            'duration': 4500,
            'order_index': 4
        }
    ])


def downgrade() -> None:
    """Remove initial education data."""
    
    # Delete in reverse order due to foreign key constraints
    op.execute("DELETE FROM education_chapters WHERE course_id IN ('course-001', 'course-002', 'course-003')")
    op.execute("DELETE FROM education_courses WHERE id IN ('course-001', 'course-002', 'course-003')")