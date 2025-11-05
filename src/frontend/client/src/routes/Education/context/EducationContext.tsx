import React, { createContext, useContext, useState, ReactNode } from 'react';

// 类型定义
export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'theory' | 'practice';
  duration: number; // 分钟
  thumbnail: string;
  instructor: string;
  rating: number;
  studentsCount: number;
  chapters: Chapter[];
  tags: string[];
  prerequisites?: string[];
  learningObjectives: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number; // 分钟
  videoUrl?: string;
  content?: string;
  orderIndex: number;
  isCompleted?: boolean;
  progress?: number; // 0-100
}

export interface LearningProgress {
  courseId: string;
  chapterId?: string;
  progress: number; // 0-100
  completed: boolean;
  lastPosition: number; // 秒
  studyTime: number; // 秒
  lastAccessTime: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  requirements: string;
  templateData?: any;
  dueDate?: string;
  maxScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 分钟
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  workflowData: any;
  score?: number;
  feedback?: string;
  status: 'pending' | 'graded' | 'draft';
  submitTime: string;
  gradeTime?: string;
}

interface EducationContextType {
  // 课程相关
  courses: Course[];
  currentCourse: Course | null;
  setCurrentCourse: (course: Course | null) => void;
  
  // 学习进度
  learningProgress: Record<string, LearningProgress>;
  updateProgress: (courseId: string, chapterId: string, progress: Partial<LearningProgress>) => void;
  
  // 作业相关
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  
  // UI状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 错误处理
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const EducationContext = createContext<EducationContextType | undefined>(undefined);

export function EducationProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [learningProgress, setLearningProgress] = useState<Record<string, LearningProgress>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = (courseId: string, chapterId: string, progress: Partial<LearningProgress>) => {
    const key = `${courseId}-${chapterId}`;
    setLearningProgress(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        courseId,
        chapterId,
        ...progress,
        lastAccessTime: new Date().toISOString(),
      }
    }));
  };

  const clearError = () => {
    setError(null);
  };

  const value: EducationContextType = {
    courses,
    currentCourse,
    setCurrentCourse,
    learningProgress,
    updateProgress,
    assignments,
    submissions,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError,
  };

  return (
    <EducationContext.Provider value={value}>
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  const context = useContext(EducationContext);
  if (context === undefined) {
    throw new Error('useEducation must be used within an EducationProvider');
  }
  return context;
}

