import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Star, TrendingUp, Award, Play } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { useEducation } from '../context/EducationContext';
import { learningPaths, achievements, allCourses } from '../data/mockData';
import EducationDemo from '../components/EducationDemo';
import { cn } from '~/utils';
import useEducationAPI from '~/hooks/Education/useEducationAPI';
import { LoadingSpinner, CourseSkeleton } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorBoundary';

export default function EducationCenter() {
  const navigate = useNavigate();
  const { setCurrentCourse, error, setError, clearError } = useEducation();
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [learningStats, setLearningStats] = useState({
    total_courses: 3,
    total_students: 2522,
    average_rating: 4.8,
    total_duration: 280
  });
  const [isLoading, setIsLoading] = useState(false);

  const { 
    coursesState, 
    fetchCourses, 
    fetchLearningStats 
  } = useEducationAPI();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      clearError();
      
      try {
        // 尝试加载课程数据，如果失败则使用mockData
        try {
          await fetchCourses({
            level: selectedLevel !== 'all' ? selectedLevel : undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
          });
          console.log('✅ API课程数据加载成功');
        } catch (apiError) {
          console.warn('⚠️ API课程数据加载失败，使用Mock数据:', apiError);
          // API失败时，我们已经在下面使用了备用数据
        }

        // 加载统计数据
        try {
          const stats = await fetchLearningStats();
          // 确保所有数值都有默认值
          setLearningStats({
            total_courses: stats.total_courses || allCourses.length,
            total_students: stats.total_students || 2522,
            average_rating: stats.average_rating || 4.8,
            total_duration: stats.total_duration || 280
          });
        } catch (error) {
          console.warn('获取统计数据失败，使用默认数据:', error);
          // 使用基于mockData的统计
          setLearningStats({
            total_courses: allCourses.length,
            total_students: 2522,
            average_rating: 4.8,
            total_duration: allCourses.reduce((total, course) => total + (course.duration || 0), 0)
          });
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // 即使出错，我们也有备用数据，所以不设置错误状态
        console.log('📚 使用Mock数据作为备用，共', allCourses.length, '门课程');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedLevel, selectedCategory, fetchCourses, fetchLearningStats, setError, clearError]);

  // 使用API数据，如果没有则使用mockData作为备用
  const apiCourses = coursesState.data?.courses || [];
  const backupCourses = allCourses || [];
  const allAvailableCourses = apiCourses.length > 0 ? apiCourses : backupCourses;
  
  // 根据筛选条件过滤课程
  const filteredCourses = allAvailableCourses.filter(course => {
    const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
    const categoryMatch = selectedCategory === 'all' || course.category === selectedCategory;
    return levelMatch && categoryMatch;
  });

  const handleCourseClick = (course: any) => {
    setCurrentCourse(course);
    navigate(`/education/courses/${course.id}`);
  };

  const handleStartLearning = (pathId: string) => {
    const path = learningPaths.find(p => p.id === pathId);
    if (path && path.courses && path.courses.length > 0) {
      const firstCourse = filteredCourses.find(c => c.id === path.courses[0]);
      if (firstCourse) {
        handleCourseClick(firstCourse);
      } else {
        // 如果没有找到课程，导航到第一个可用课程
        if (filteredCourses.length > 0) {
          handleCourseClick(filteredCourses[0]);
        }
      }
    }
  };

  const handleRetry = () => {
    clearError();
    // 重新触发数据加载
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchCourses({
          level: selectedLevel !== 'all' ? selectedLevel : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        });
        const stats = await fetchLearningStats();
        setLearningStats(stats);
      } catch (error) {
        setError(error instanceof Error ? error.message : '加载数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  };

  if (isLoading) {
    return (
      <div className="education-center max-w-7xl mx-auto px-4 py-8">
        <LoadingSpinner size="lg" message="正在加载课程数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="education-center max-w-7xl mx-auto px-4 py-8">
        <ErrorMessage 
          message={error} 
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="education-center max-w-7xl mx-auto px-4 py-8">
      {/* 头部横幅 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-main to-brand-purple rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              智能体教学中心
            </h1>
            <p className="text-lg text-text-secondary">
              从零开始，掌握智能体开发技能，成为AI时代的技术专家
            </p>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-main">{learningStats.total_courses || 0}</div>
            <div className="text-sm text-text-secondary">精品课程</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-main">{(learningStats.total_students || 0).toLocaleString()}</div>
            <div className="text-sm text-text-secondary">学习人数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-main">{learningStats.average_rating || 0}</div>
            <div className="text-sm text-text-secondary">平均评分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-main">{learningStats.total_duration || 0}</div>
            <div className="text-sm text-text-secondary">总时长(分钟)</div>
          </div>
        </div>
      </div>

      {/* 学习路径 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-main" />
          推荐学习路径
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(learningPaths || []).map((path) => (
            <Card key={path.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">{path.icon}</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {path.title}
                </h3>
                <p className="text-text-secondary mb-4 text-sm">
                  {path.description}
                </p>
                <div className="flex justify-between items-center text-sm text-text-secondary mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {path.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {(path.courses || []).length} 门课程
                  </span>
                </div>
                <Button 
                  onClick={() => handleStartLearning(path.id)}
                  className="w-full"
                  variant="submit"
                >
                  开始学习
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 课程筛选 */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-text-primary font-medium">筛选课程：</span>
          
          {/* 难度筛选 */}
          <div className="flex gap-2">
            <Button
              variant={selectedLevel === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel('all')}
            >
              全部难度
            </Button>
            <Button
              variant={selectedLevel === 'beginner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel('beginner')}
            >
              入门
            </Button>
            <Button
              variant={selectedLevel === 'intermediate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel('intermediate')}
            >
              进阶
            </Button>
            <Button
              variant={selectedLevel === 'advanced' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel('advanced')}
            >
              实战
            </Button>
          </div>

          {/* 类型筛选 */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              全部类型
            </Button>
            <Button
              variant={selectedCategory === 'theory' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('theory')}
            >
              理论课程
            </Button>
            <Button
              variant={selectedCategory === 'practice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('practice')}
            >
              实践项目
            </Button>
          </div>
        </div>
      </section>

      {/* 课程列表 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-main" />
          课程列表
        </h2>
        
        {coursesState.loading ? (
          <CourseSkeleton />
        ) : coursesState.error ? (
          <ErrorMessage 
            message={coursesState.error} 
            onRetry={handleRetry}
          />
        ) : filteredCourses.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              暂无课程
            </h3>
            <p className="text-text-secondary">
              当前筛选条件下没有找到相关课程，请尝试调整筛选条件。
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => handleCourseClick(course)}>
                {/* 课程缩略图 */}
                <div className="relative h-48 bg-gradient-to-br from-blue-main/10 to-brand-purple/10 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-main to-brand-purple rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  {/* 难度标签 */}
                  <div className={cn(
                    "absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium",
                    course.level === 'beginner' && "bg-green-100 text-green-700",
                    course.level === 'intermediate' && "bg-yellow-100 text-yellow-700",
                    course.level === 'advanced' && "bg-red-100 text-red-700"
                  )}>
                    {course.level === 'beginner' && '入门'}
                    {course.level === 'intermediate' && '进阶'}
                    {course.level === 'advanced' && '实战'}
                  </div>
                  {/* 播放按钮 */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-blue-main ml-1" />
                    </div>
                  </div>
                </div>

                {/* 课程信息 */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* 讲师信息 */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-main to-brand-purple rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">智</span>
                    </div>
                    <span className="text-text-secondary text-sm">{course.instructor}</span>
                  </div>

                  {/* 课程统计 */}
                  <div className="flex justify-between items-center text-sm text-text-secondary mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration} 分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {(course.studentsCount || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </span>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(course.tags || []).slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-surface-secondary rounded-full text-xs text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <Button 
                    className="w-full"
                    variant="submit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course);
                    }}
                  >
                    开始学习
                  </Button>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}
      </section>

      {/* 功能演示 */}
      <section className="mb-12">
        <EducationDemo />
      </section>

      {/* 成就系统预览 */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-main" />
          学习成就
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(achievements || []).map((achievement) => (
            <Card key={achievement.id} className="p-4 text-center">
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <h4 className="font-semibold text-text-primary text-sm mb-1">
                {achievement.title}
              </h4>
              <p className="text-xs text-text-secondary">
                {achievement.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
