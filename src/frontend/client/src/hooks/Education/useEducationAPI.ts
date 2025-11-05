import { useState, useCallback } from 'react';
import educationAPI from '../../api/education';
import { Course, Chapter, LearningProgress } from '../../routes/Education/context/EducationContext';

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useEducationAPI() {
  const [coursesState, setCoursesState] = useState<APIState<{ courses: Course[]; total: number }>>({
    data: null,
    loading: false,
    error: null,
  });

  const [courseDetailState, setCourseDetailState] = useState<APIState<Course>>({
    data: null,
    loading: false,
    error: null,
  });

  const [progressState, setProgressState] = useState<APIState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  const [videoState, setVideoState] = useState<APIState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  // 获取课程列表
  const fetchCourses = useCallback(async (params?: {
    level?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) => {
    setCoursesState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await educationAPI.course.getCourses(params);
      setCoursesState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      let errorMessage = '获取课程列表失败';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      // 网络错误处理
      if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接后重试';
      }
      
      setCoursesState({ data: null, loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  // 获取课程详情
  const fetchCourseDetail = useCallback(async (courseId: string) => {
    setCourseDetailState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await educationAPI.course.getCourseDetail(courseId);
      setCourseDetailState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      let errorMessage = '获取课程详情失败';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // 404错误处理
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        errorMessage = '课程不存在或已被删除';
      }
      
      setCourseDetailState({ data: null, loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  // 获取用户学习进度
  const fetchUserProgress = useCallback(async () => {
    setProgressState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await educationAPI.progress.getUserProgress();
      setProgressState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取学习进度失败';
      setProgressState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // 获取视频信息
  const fetchVideoInfo = useCallback(async (chapterId: string) => {
    setVideoState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await educationAPI.video.getVideoInfo(chapterId);
      setVideoState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取视频信息失败';
      setVideoState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // 更新视频观看进度
  const updateVideoProgress = useCallback(async (chapterId: string, data: {
    position: number;
    completed: boolean;
  }) => {
    try {
      await educationAPI.video.updateProgress(chapterId, data);
    } catch (error) {
      console.error('更新视频进度失败:', error);
      throw error;
    }
  }, []);

  // 标记章节完成
  const completeChapter = useCallback(async (chapterId: string) => {
    try {
      await educationAPI.progress.completeChapter(chapterId);
    } catch (error) {
      console.error('标记章节完成失败:', error);
      throw error;
    }
  }, []);

  // 引导式构建器相关状态
  const [guidedStepsState, setGuidedStepsState] = useState<APIState<any>>({
    data: null,
    loading: false,
    error: null
  });

  const [progressSummaryState, setProgressSummaryState] = useState<APIState<any>>({
    data: null,
    loading: false,
    error: null
  });

  // 获取引导步骤
  const fetchGuidedSteps = useCallback(async () => {
    setGuidedStepsState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await educationAPI.getGuidedSteps();
      setGuidedStepsState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取引导步骤失败';
      setGuidedStepsState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // 保存引导进度
  const saveGuidedProgress = useCallback(async (data: {
    step_id: string;
    completed: boolean;
    config_data?: any;
  }) => {
    try {
      const result = await educationAPI.saveGuidedProgress(data);
      // 重新获取进度摘要
      await fetchProgressSummary();
      return result;
    } catch (error) {
      console.error('保存引导进度失败:', error);
      throw error;
    }
  }, []);

  // 获取进度摘要
  const fetchProgressSummary = useCallback(async () => {
    setProgressSummaryState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await educationAPI.getProgressSummary();
      setProgressSummaryState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取进度摘要失败';
      setProgressSummaryState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  // 生成智能体配置
  const generateAgentConfig = useCallback(async () => {
    try {
      const result = await educationAPI.generateAgentConfig();
      return result;
    } catch (error) {
      console.error('生成智能体配置失败:', error);
      throw error;
    }
  }, []);

  // 获取学习统计
  const fetchLearningStats = useCallback(async () => {
    try {
      const data = await educationAPI.stats.getLearningStats();
      return data;
    } catch (error) {
      console.error('获取学习统计失败:', error);
      throw error;
    }
  }, []);

  return {
    // 状态
    coursesState,
    courseDetailState,
    progressState,
    videoState,
    guidedStepsState,
    progressSummaryState,

    // 方法
    fetchCourses,
    fetchCourseDetail,
    fetchUserProgress,
    fetchVideoInfo,
    updateVideoProgress,
    completeChapter,
    fetchGuidedSteps,
    saveGuidedProgress,
    fetchProgressSummary,
    generateAgentConfig,
    fetchLearningStats,
  };
}

export default useEducationAPI;