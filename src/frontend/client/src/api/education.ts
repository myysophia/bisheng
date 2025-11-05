import request from './request';
import { Course, Chapter, LearningProgress, Assignment } from '../routes/Education/context/EducationContext';

// API 基础路径
const API_BASE = '/api/v1/education';

// 课程相关 API
export const courseAPI = {
  // 获取课程列表
  getCourses: async (params?: {
    level?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ courses: Course[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.level && params.level !== 'all') {
      queryParams.append('level', params.level);
    }
    if (params?.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE}/courses${queryString ? `?${queryString}` : ''}`;
    
    return await request.get(url);
  },

  // 获取课程详情
  getCourseDetail: async (courseId: string): Promise<Course> => {
    return await request.get(`${API_BASE}/courses/${courseId}`);
  },

  // 获取课程章节列表
  getCourseChapters: async (courseId: string): Promise<Chapter[]> => {
    return await request.get(`${API_BASE}/courses/${courseId}/chapters`);
  },
};

// 视频相关 API
export const videoAPI = {
  // 获取视频播放信息
  getVideoInfo: async (chapterId: string): Promise<{
    video_url: string;
    duration: number;
    last_position: number;
  }> => {
    return await request.get(`${API_BASE}/videos/${chapterId}`);
  },

  // 更新观看进度
  updateProgress: async (chapterId: string, data: {
    position: number;
    completed: boolean;
  }): Promise<void> => {
    return await request.post(`${API_BASE}/videos/${chapterId}/progress`, data);
  },
};

// 学习进度相关 API
export const progressAPI = {
  // 获取用户学习进度
  getUserProgress: async (): Promise<{
    total_courses: number;
    completed_courses: number;
    total_learning_time: number;
    courses_progress: Array<{
      course_id: string;
      progress: number;
      completed_chapters: number;
      total_chapters: number;
    }>;
  }> => {
    return await request.get(`${API_BASE}/progress`);
  },

  // 标记章节完成
  completeChapter: async (chapterId: string): Promise<void> => {
    return await request.post(`${API_BASE}/progress/chapters/${chapterId}/complete`);
  },

  // 获取课程进度详情
  getCourseProgress: async (courseId: string): Promise<{
    course_id: string;
    progress: number;
    chapters: Array<{
      chapter_id: string;
      completed: boolean;
      progress: number;
      last_position: number;
      study_time: number;
    }>;
  }> => {
    return await request.get(`${API_BASE}/progress/courses/${courseId}`);
  },
};

// 引导式构建相关 API
export const guidedBuilderAPI = {
  // 获取引导步骤
  getSteps: async (): Promise<{
    steps: Array<{
      id: string;
      title: string;
      description: string;
      focus_element: string;
      instructions: string;
      order_index: number;
    }>;
  }> => {
    return await request.get(`${API_BASE}/guided-builder/steps`);
  },

  // 保存引导进度
  saveProgress: async (data: {
    step_id: string;
    completed: boolean;
    config_data?: any;
  }): Promise<void> => {
    return await request.post(`${API_BASE}/guided-builder/progress`, data);
  },

  // 获取用户引导进度
  getUserProgress: async (): Promise<{
    steps: Array<{
      step_id: string;
      completed: boolean;
      config_data?: any;
    }>;
  }> => {
    return await request.get(`${API_BASE}/guided-builder/progress`);
  },
};

// 统计相关 API
export const statsAPI = {
  // 获取学习统计数据
  getLearningStats: async (): Promise<{
    total_courses: number;
    total_students: number;
    average_rating: number;
    total_duration: number;
  }> => {
    return await request.get(`${API_BASE}/stats/overview`);
  },
};

// 引导式构建器相关API
const getGuidedSteps = async (): Promise<{
  steps: Array<{
    id: string;
    title: string;
    description: string;
    focus_element: string;
    instructions: string;
  }>;
}> => {
  return await request.get(`${API_BASE}/guided-builder/steps`);
};

const saveGuidedProgress = async (data: {
  step_id: string;
  completed: boolean;
  config_data: any;
}): Promise<{ success: boolean }> => {
  return await request.post(`${API_BASE}/guided-builder/progress`, data);
};

const getProgressSummary = async (): Promise<{
  total_steps: number;
  completed_steps: string[];
  current_step: string | null;
  completion_percentage: number;
}> => {
  return await request.get(`${API_BASE}/guided-builder/progress/summary`);
};

const generateAgentConfig = async (): Promise<{
  config: any;
  success: boolean;
}> => {
  return await request.post(`${API_BASE}/guided-builder/generate`);
};

// 获取学习统计数据
const getLearningStats = async (): Promise<{
  total_courses: number;
  total_students: number;
  average_rating: number;
  total_duration: number;
}> => {
  return await request.get(`${API_BASE}/stats/overview`);
};

// 导出所有 API
export default {
  course: courseAPI,
  video: videoAPI,
  progress: progressAPI,
  guidedBuilder: guidedBuilderAPI,
  stats: statsAPI,
  
  // 直接导出的方法
  getGuidedSteps,
  saveGuidedProgress,
  getProgressSummary,
  generateAgentConfig,
  getLearningStats,
};