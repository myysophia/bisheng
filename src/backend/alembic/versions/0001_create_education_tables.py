"""Create education system tables

Revision ID: 0001
Revises: 
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create education system tables."""
    
    # Create education_courses table
    op.create_table(
        'education_courses',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('level', sa.String(20), nullable=False, comment='beginner/intermediate/advanced'),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('duration', sa.Integer, nullable=True, comment='总时长(分钟)'),
        sa.Column('thumbnail', sa.String(500), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Create indexes for education_courses
    op.create_index('idx_level', 'education_courses', ['level'])
    op.create_index('idx_category', 'education_courses', ['category'])
    op.create_index('idx_created_at', 'education_courses', ['created_at'])
    
    # Create education_chapters table
    op.create_table(
        'education_chapters',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('course_id', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('duration', sa.Integer, nullable=True, comment='时长(秒)'),
        sa.Column('order_index', sa.Integer, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['course_id'], ['education_courses.id'], ondelete='CASCADE'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Create indexes for education_chapters
    op.create_index('idx_course_order', 'education_chapters', ['course_id', 'order_index'])
    op.create_index('idx_course_id', 'education_chapters', ['course_id'])
    
    # Create education_user_progress table
    op.create_table(
        'education_user_progress',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, nullable=False, comment='关联现有用户系统'),
        sa.Column('course_id', sa.String(50), nullable=False),
        sa.Column('chapter_id', sa.String(50), nullable=False),
        sa.Column('progress', sa.Float, nullable=False, default=0.0, comment='0-1之间的进度'),
        sa.Column('last_position', sa.Integer, nullable=False, default=0, comment='视频观看位置(秒)'),
        sa.Column('completed', sa.Boolean, nullable=False, default=False),
        sa.Column('learning_time', sa.Integer, nullable=False, default=0, comment='学习时长(秒)'),
        sa.Column('created_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['course_id'], ['education_courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['education_chapters.id'], ondelete='CASCADE'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Create indexes and unique constraints for education_user_progress
    op.create_index('unique_user_chapter', 'education_user_progress', ['user_id', 'chapter_id'], unique=True)
    op.create_index('idx_user_course', 'education_user_progress', ['user_id', 'course_id'])
    op.create_index('idx_user_id', 'education_user_progress', ['user_id'])
    op.create_index('idx_completed', 'education_user_progress', ['completed'])
    op.create_index('idx_updated_at', 'education_user_progress', ['updated_at'])
    
    # Create education_guided_progress table
    op.create_table(
        'education_guided_progress',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('step_id', sa.String(50), nullable=False),
        sa.Column('completed', sa.Boolean, nullable=False, default=False),
        sa.Column('config_data', sa.JSON, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Create indexes and unique constraints for education_guided_progress
    op.create_index('unique_user_step', 'education_guided_progress', ['user_id', 'step_id'], unique=True)
    op.create_index('idx_user_id_guided', 'education_guided_progress', ['user_id'])
    op.create_index('idx_step_id', 'education_guided_progress', ['step_id'])
    op.create_index('idx_completed_guided', 'education_guided_progress', ['completed'])


def downgrade() -> None:
    """Drop education system tables."""
    
    # Drop tables in reverse order due to foreign key constraints
    op.drop_table('education_guided_progress')
    op.drop_table('education_user_progress')
    op.drop_table('education_chapters')
    op.drop_table('education_courses')