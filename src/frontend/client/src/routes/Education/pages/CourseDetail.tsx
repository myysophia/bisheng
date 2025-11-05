import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  CheckCircle, 
  Circle,
  Award,
  Target,
  List,
  PlayCircle
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { useEducation } from '../context/EducationContext';
import { mockLearningProgress } from '../data/mockData';
import { cn } from '~/utils';
import useEducationAPI from '~/hooks/Education/useEducationAPI';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentCourse, setCurrentCourse, learningProgress, updateProgress } = useEducation();
  const [course, setCourse] = useState(currentCourse);
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'assignments'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const { fetchCourseDetail } = useEducationAPI();

  useEffect(() => {
    const loadCourse = async () => {
      if (!course && courseId) {
        setIsLoading(true);
        try {
          const courseData = await fetchCourseDetail(courseId);
          setCourse(courseData);
          setCurrentCourse(courseData);
        } catch (error) {
          console.error('加载课程详情失败:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCourse();
  }, [courseId, course, setCurrentCourse, fetchCourseDetail]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-text-secondary mb-4">课程未找到</div>
          <Button onClick={() => navigate('/education')} variant="outline">
            返回课程中心
          </Button>
        </div>
      </div>
    );
  }

  const handleStartChapter = (chapterId: string) => {
    navigate(`/education/courses/${course.id}/chapters/${chapterId}`);
  };

  const getChapterProgress = (chapterId: string) => {
    const key = `${course.id}-${chapterId}`;
    return mockLearningProgress[key] || { progress: 0, completed: false };
  };

  const calculateCourseProgress = () => {
    const chapters = course.chapters || [];
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(chapter => 
      getChapterProgress(chapter.id).completed
    ).length;
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };

  const courseProgress = calculateCourseProgress();
  const completedChapters = (course.chapters || []).filter(chapter => 
    getChapterProgress(chapter.id).completed
  ).length;

  return (
    <div className="course-detail max-w-6xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={() => navigate('/education')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        返回课程中心
      </Button>

      {/* 课程头部信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 左侧：课程基本信息 */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                course.level === 'beginner' && "bg-green-100 text-green-700",
                course.level === 'intermediate' && "bg-yellow-100 text-yellow-700",
                course.level === 'advanced' && "bg-red-100 text-red-700"
              )}>
                {course.level === 'beginner' && '入门课程'}
                {course.level === 'intermediate' && '进阶课程'}
                {course.level === 'advanced' && '实战项目'}
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {course.category === 'theory' ? '理论课程' : '实践项目'}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {course.title}
            </h1>

            <p className="text-text-secondary text-lg mb-6">
              {course.description}
            </p>

            {/* 课程统计 */}
            <div className="flex flex-wrap gap-6 text-text-secondary">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.duration} 分钟</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{(course.studentsCount || 0).toLocaleString()} 学员</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>{course.rating} 评分</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{(course.chapters || []).length} 章节</span>
              </div>
            </div>
          </div>

          {/* 讲师信息 */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">讲师介绍</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-main to-brand-purple rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">智</span>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{course.instructor}</h4>
                <p className="text-text-secondary text-sm">
                  专业的AI数字人导师，拥有丰富的智能体开发经验，致力于帮助学员快速掌握AI技术。
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧：学习进度和操作 */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8">
            {/* 学习进度 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-primary font-medium">学习进度</span>
                <span className="text-blue-main font-semibold">{courseProgress}%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-main h-2 rounded-full transition-all duration-300"
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-text-secondary">
                已完成 {completedChapters} / {(course.chapters || []).length} 章节
              </div>
            </div>

            {/* 开始学习按钮 */}
            <Button 
              className="w-full mb-4"
              variant="submit"
              onClick={() => {
                const chapters = course.chapters || [];
                const nextChapter = chapters.find(chapter => 
                  !getChapterProgress(chapter.id).completed
                ) || chapters[0];
                if (nextChapter) {
                  handleStartChapter(nextChapter.id);
                }
              }}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {courseProgress > 0 ? '继续学习' : '开始学习'}
            </Button>

            {/* 课程标签 */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-text-primary mb-3">课程标签</h4>
              <div className="flex flex-wrap gap-2">
                {(course.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-surface-secondary rounded-full text-xs text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 前置要求 */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-text-primary mb-3">前置要求</h4>
                <ul className="space-y-2">
                  {(course.prerequisites || []).map((prereq, index) => (
                    <li key={index} className="text-sm text-text-secondary flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-border-light mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'overview'
                ? "border-blue-main text-blue-main"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            <List className="w-4 h-4 inline mr-2" />
            课程概览
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'chapters'
                ? "border-blue-main text-blue-main"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            课程章节
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'assignments'
                ? "border-blue-main text-blue-main"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            <Award className="w-4 h-4 inline mr-2" />
            课程作业
          </button>
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 学习目标 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-main" />
                学习目标
              </h3>
              <ul className="space-y-3">
                {(course.learningObjectives || []).map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">{objective}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* 课程大纲 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-main" />
                课程大纲
              </h3>
              <div className="space-y-3">
                {(course.chapters || []).map((chapter, index) => (
                  <div key={chapter.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                    <div className="w-6 h-6 bg-blue-main/10 text-blue-main rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary text-sm">{chapter.title}</div>
                      <div className="text-xs text-text-secondary">{chapter.duration} 分钟</div>
                    </div>
                    {getChapterProgress(chapter.id).completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="space-y-4">
            {(course.chapters || []).map((chapter, index) => {
              const progress = getChapterProgress(chapter.id);
              return (
                <Card key={chapter.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-main/10 text-blue-main rounded-lg flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {chapter.title}
                        </h3>
                        <p className="text-text-secondary text-sm mb-2">
                          {chapter.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {chapter.duration} 分钟
                          </span>
                          {progress.completed && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              已完成
                            </span>
                          )}
                          {!progress.completed && progress.progress > 0 && (
                            <span className="text-blue-main">
                              进度: {Math.round(progress.progress)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartChapter(chapter.id)}
                      variant={progress.completed ? "outline" : "submit"}
                      className="ml-4"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {progress.completed ? '重新学习' : progress.progress > 0 ? '继续学习' : '开始学习'}
                    </Button>
                  </div>
                  
                  {/* 进度条 */}
                  {progress.progress > 0 && (
                    <div className="mt-4">
                      <div className="w-full bg-surface-secondary rounded-full h-2">
                        <div 
                          className="bg-blue-main h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'assignments' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                课程作业
              </h3>
              <p className="text-text-secondary mb-6">
                完成课程学习后，将解锁相关的实践作业
              </p>
              <Button variant="outline" disabled>
                作业功能开发中...
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

