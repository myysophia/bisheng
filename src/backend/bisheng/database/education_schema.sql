-- Education System Database Schema
-- MySQL DDL script for creating education-related tables

-- 课程表
CREATE TABLE IF NOT EXISTS education_courses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level VARCHAR(20) NOT NULL COMMENT 'beginner/intermediate/advanced',
    category VARCHAR(50),
    duration INTEGER COMMENT '总时长(分钟)',
    thumbnail VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);

-- 章节表
CREATE TABLE IF NOT EXISTS education_chapters (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    duration INTEGER COMMENT '时长(秒)',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES education_courses(id) ON DELETE CASCADE,
    INDEX idx_course_order (course_id, order_index),
    INDEX idx_course_id (course_id)
);

-- 用户学习进度表
CREATE TABLE IF NOT EXISTS education_user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '关联现有用户系统',
    course_id VARCHAR(50) NOT NULL,
    chapter_id VARCHAR(50) NOT NULL,
    progress FLOAT DEFAULT 0 COMMENT '0-1之间的进度',
    last_position INT DEFAULT 0 COMMENT '视频观看位置(秒)',
    completed TINYINT(1) DEFAULT 0,
    learning_time INT DEFAULT 0 COMMENT '学习时长(秒)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES education_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES education_chapters(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_chapter (user_id, chapter_id),
    INDEX idx_user_course (user_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_completed (completed),
    INDEX idx_updated_at (updated_at)
);

-- 引导构建进度表
CREATE TABLE IF NOT EXISTS education_guided_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    step_id VARCHAR(50) NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    config_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_step (user_id, step_id),
    INDEX idx_user_id (user_id),
    INDEX idx_step_id (step_id),
    INDEX idx_completed (completed)
);