import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Clock, Users, Star, TrendingUp, Award, Play, Target, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/bs-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/bs-ui/card';
import { useTranslation } from 'react-i18next';
import { educationAPI } from '@/controllers/API/education';
import { captureAndAlertRequestErrorHoc } from '@/controllers/request';

// 课程数据接口定义
interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'theory' | 'practice';
  duration: number;
  instructor?: string;
  rating?: number;
  studentsCount?: number;
  tags?: string[];
  chapters?: number;
  progress?: number;
  thumbnail?: string;
}

interface LearningStats {
  total_courses: number;
  total_students: number;
  average_rating: number;
  total_duration: number;
}

const learningPaths = [
  {
    id: 'path-beginner',
    title: '入门学习路径',
    description: '适合零基础学员，从基础概念开始系统学习',
    courses: ['course-1'],
    estimatedTime: '1-2周',
    difficulty: 'beginner',
    icon: '🌱',
  },
  {
    id: 'path-intermediate',
    title: '进阶学习路径',
    description: '适合有一定基础的学员，深入学习高级技术',
    courses: ['course-1', 'course-2'],
    estimatedTime: '2-3周',
    difficulty: 'intermediate',
    icon: '🚀',
  },
  {
    id: 'path-advanced',
    title: '实战学习路径',
    description: '适合希望通过项目实践提升技能的学员',
    courses: ['course-1', 'course-2', 'course-3'],
    estimatedTime: '4-6周',
    difficulty: 'advanced',
    icon: '🎯',
  },
];

const achievements = [
  { id: 'first-course', title: '初学者', description: '完成第一门课程', icon: '🎓' },
  { id: 'speed-learner', title: '学习达人', description: '一周内完成3门课程', icon: '⚡' },
  { id: 'perfect-score', title: '完美主义者', description: '作业获得满分', icon: '💯' },
  { id: 'practice-master', title: '实践大师', description: '完成所有实战项目', icon: '🏆' },
];

const resolveBasePath = () => {
  if (__APP_ENV__.BASE_URL) {
    return __APP_ENV__.BASE_URL;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { pathname } = window.location;
  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    return '/workspace';
  }

  return '';
};

export default function EducationPage() {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    total_courses: 0,
    total_students: 0,
    average_rating: 0,
    total_duration: 0
  });

  const basePath = useMemo(resolveBasePath, []);
  const openClientPage = (relativePath: string) => {
    if (typeof window === 'undefined') return;
    const target = `${window.location.origin}${basePath}${relativePath}`;
    window.location.href = target;
  };

  // 加载课程数据
  const loadCourses = async () => {
    try {
      const response = await educationAPI.course.getCourses({
        level: selectedLevel !== 'all' ? selectedLevel : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setCourses(response.courses || []);
    } catch (error) {
      console.error('加载课程失败:', error);
      // 如果API失败，使用fallback数据
      setCourses([]);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const stats = await educationAPI.stats.getLearningStats();
      setLearningStats(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 使用默认统计数据
      setLearningStats({
        total_courses: 3,
        total_students: 2522,
        average_rating: 4.8,
        total_duration: 280
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadCourses(), loadStats()]);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedLevel, selectedCategory]);

  const filteredCourses = courses;

  const handleCourseClick = (courseId: string) => {
    // 跳转到客户端的教学界面 - 在当前标签页中打开
    openClientPage(`/education/courses/${courseId}`);
  };

  const handleStartLearning = () => {
    // 跳转到客户端的教学界面 - 在当前标签页中打开
    openClientPage('/education');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="education-page h-full overflow-y-auto">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* 头部横幅 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              智能体教学中心
            </h1>
            <p className="text-lg text-muted-foreground">
              从零开始，掌握智能体开发技能，成为AI时代的技术专家
            </p>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{learningStats.total_courses}</div>
            <div className="text-sm text-muted-foreground">精品课程</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{learningStats.total_students.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">学习人数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{learningStats.average_rating}</div>
            <div className="text-sm text-muted-foreground">平均评分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{learningStats.total_duration}</div>
            <div className="text-sm text-muted-foreground">总时长(分钟)</div>
          </div>
        </div>
      </div>

      {/* 快速入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            快速开始
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => openClientPage('/education')}
              className="flex-1"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              进入教学界面
            </Button>
            <Button 
              variant="outline"
              onClick={() => openClientPage('/education/progress')}
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              查看学习进度
            </Button>
            <Button 
              variant="outline"
              onClick={() => openClientPage('/education/practice/assignment-1')}
              className="flex-1"
            >
              <Target className="w-4 h-4 mr-2" />
              实践环境
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 学习路径 */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          推荐学习路径
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningPaths.map((path) => (
            <Card key={path.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">{path.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {path.title}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {path.description}
                </p>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {path.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {path.courses.length} 门课程
                  </span>
                </div>
                <Button 
                  onClick={handleStartLearning}
                  className="w-full"
                >
                  开始学习
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 课程筛选 */}
      <section>
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <span className="text-foreground font-medium">筛选课程：</span>
          
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

        {/* 课程列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div onClick={() => handleCourseClick(course.id)}>
                  {/* 课程缩略图 */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    {/* 难度标签 */}
                    <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${
                      course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {course.level === 'beginner' && '入门'}
                      {course.level === 'intermediate' && '进阶'}
                      {course.level === 'advanced' && '实战'}
                    </div>
                    {/* 播放按钮 */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* 课程信息 */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    {/* 讲师信息 */}
                    {course.instructor && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">智</span>
                        </div>
                        <span className="text-muted-foreground text-sm">{course.instructor}</span>
                      </div>
                    )}

                    {/* 课程统计 */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration} 分钟
                      </span>
                      {course.studentsCount && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.studentsCount.toLocaleString()}
                        </span>
                      )}
                      {course.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </span>
                      )}
                    </div>

                    {/* 标签 */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCourseClick(course.id);
                      }}
                    >
                      开始学习
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 成就系统预览 */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          学习成就
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1">
                  {achievement.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
