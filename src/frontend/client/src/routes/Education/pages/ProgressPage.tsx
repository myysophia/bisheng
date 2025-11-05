import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp,
  CheckCircle,
  Play,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { useEducation } from '../context/EducationContext';
import { cn } from '~/utils';
import useEducationAPI from '~/hooks/Education/useEducationAPI';

interface ProgressStats {
  total_courses: number;
  completed_courses: number;
  total_learning_time: number;
  courses_progress: Array<{
    course_id: string;
    progress: number;
    completed_chapters: number;
    total_chapters: number;
  }>;
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { courses } = useEducation();
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    total_courses: 0,
    completed_courses: 0,
    total_learning_time: 0,
    courses_progress: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const { fetchUserProgress, fetchCourses } = useEducationAPI();

  useEffect(() => {
    const loadProgressData = async () => {
      setIsLoading(true);
      try {
        // 加载用户进度数据
        const progressData = await fetchUserProgress();
        setProgressStats(progressData);

        // 如果课程数据为空，也加载课程数据
        if (!courses || courses.length === 0) {
          await fetchCourses();
        }
      } catch (error) {
        console.error('加载进度数据失败:', error);
        // 使用默认数据
        setProgressStats({
          total_courses: 3,
          completed_courses: 1,
          total_learning_time: 3600,
          courses_progress: [
            { course_id: 'course-1', progress: 60, completed_chapters: 3, total_chapters: 5 },
            { course_id: 'course-2', progress: 20, completed_chapters: 1, total_chapters: 5 },
            { course_id: 'course-3', progress: 0, completed_chapters: 0, total_chapters: 6 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [fetchUserProgress, fetchCourses, courses]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const getOverallProgress = () => {
    if (progressStats.total_courses === 0) return 0;
    return Math.round((progressStats.completed_courses / progressStats.total_courses) * 100);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/education/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  return (
    <div className="progress-page max-w-6xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={() => navigate('/education')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        返回教学中心
      </Button>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-main" />
          学习进度
        </h1>
        <p className="text-text-secondary">
          查看你的学习成果和进度统计
        </p>
      </div>

      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-main rounded-lg flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {progressStats.total_courses}
          </div>
          <div className="text-sm text-text-secondary">总课程数</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {progressStats.completed_courses}
          </div>
          <div className="text-sm text-text-secondary">已完成课程</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {formatTime(progressStats.total_learning_time)}
          </div>
          <div className="text-sm text-text-secondary">总学习时长</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {getOverallProgress()}%
          </div>
          <div className="text-sm text-text-secondary">总体进度</div>
        </Card>
      </div>

      {/* 整体进度条 */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-main" />
            整体学习进度
          </h2>
          <span className="text-blue-main font-semibold text-lg">
            {getOverallProgress()}%
          </span>
        </div>
        
        <div className="w-full bg-surface-secondary rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-main to-brand-purple h-4 rounded-full transition-all duration-500"
            style={{ width: `${getOverallProgress()}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-text-secondary">
          <span>已完成 {progressStats.completed_courses} / {progressStats.total_courses} 门课程</span>
          <span>继续加油！</span>
        </div>
      </Card>

      {/* 课程进度详情 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-main" />
          课程进度详情
        </h2>
        
        <div className="space-y-4">
          {(progressStats.courses_progress || []).map((courseProgress) => {
            const progressPercentage = Math.round(courseProgress.progress);
            const isCompleted = courseProgress.completed_chapters === courseProgress.total_chapters;
            
            return (
              <Card key={courseProgress.course_id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      isCompleted 
                        ? "bg-green-100 text-green-600" 
                        : progressPercentage > 0 
                        ? "bg-blue-100 text-blue-main" 
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <BookOpen className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-1">
                        课程 {courseProgress.course_id.split('-')[1]}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span>
                          {courseProgress.completed_chapters} / {courseProgress.total_chapters} 章节
                        </span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          isCompleted 
                            ? "bg-green-100 text-green-700"
                            : progressPercentage > 0 
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {isCompleted ? '已完成' : progressPercentage > 0 ? '学习中' : '未开始'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-text-primary">
                        {progressPercentage}%
                      </div>
                      <div className="text-xs text-text-secondary">完成度</div>
                    </div>
                    
                    <Button
                      onClick={() => handleCourseClick(courseProgress.course_id)}
                      variant={isCompleted ? "outline" : "submit"}
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isCompleted ? '重新学习' : progressPercentage > 0 ? '继续学习' : '开始学习'}
                    </Button>
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className="w-full bg-surface-secondary rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      isCompleted 
                        ? "bg-green-500" 
                        : "bg-gradient-to-r from-blue-main to-brand-purple"
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 学习建议 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-blue-main" />
          学习建议
        </h2>
        
        <div className="space-y-4">
          {getOverallProgress() < 30 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-main rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-1">开始你的学习之旅</h4>
                <p className="text-sm text-text-secondary">
                  建议从基础课程开始，循序渐进地学习智能体相关知识。
                </p>
              </div>
            </div>
          )}
          
          {getOverallProgress() >= 30 && getOverallProgress() < 70 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-1">保持学习节奏</h4>
                <p className="text-sm text-text-secondary">
                  你已经有了不错的进展！建议每天坚持学习，保持连续性。
                </p>
              </div>
            </div>
          )}
          
          {getOverallProgress() >= 70 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-1">即将完成！</h4>
                <p className="text-sm text-text-secondary">
                  恭喜你已经完成了大部分课程！继续努力，完成剩余的学习内容。
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-1">制定学习计划</h4>
              <p className="text-sm text-text-secondary">
                建议每周安排固定的学习时间，这样可以更好地掌握知识并保持学习动力。
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}