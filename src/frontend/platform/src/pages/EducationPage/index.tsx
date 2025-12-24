import React, { useRef, useState, useEffect } from 'react';
import { BookOpen, Clock, Users, Star, Play, Target, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/bs-ui/badge';
import { Button } from '@/components/bs-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/bs-ui/card';
import { educationAPI } from '@/controllers/API/education';
import { useNavigate } from 'react-router-dom';
import type { Course, LearningStats } from './types';
import { EducationLoading } from './components/StateCard';

const levelLabels: Record<Course['level'], string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '实战',
};

export default function EducationPage() {
  const navigate = useNavigate();
  const courseSectionRef = useRef<HTMLDivElement | null>(null);
  const defaultCover = '/assets/education/ai-agent-course-cover.png';
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    total_courses: 0,
    total_students: 0,
    average_rating: 0,
    total_duration: 0
  });
  const [displayStats, setDisplayStats] = useState<LearningStats>({
    total_courses: 0,
    total_students: 0,
    average_rating: 0,
    total_duration: 0
  });
  const displayStatsRef = useRef(displayStats);

  // 加载课程数据
  const loadCourses = async () => {
    setIsCoursesLoading(true);
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
    } finally {
      setIsCoursesLoading(false);
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
    loadCourses();
    loadStats();
  }, [selectedLevel, selectedCategory]);

  useEffect(() => {
    displayStatsRef.current = displayStats;
  }, [displayStats]);

  useEffect(() => {
    const startStats = displayStatsRef.current;
    const targetStats = learningStats;
    const hasChange = Object.keys(targetStats).some((key) => {
      const statKey = key as keyof LearningStats;
      return startStats[statKey] !== targetStats[statKey];
    });
    if (!hasChange) {
      return;
    }
    let rafId = 0;
    let startTime: number | null = null;
    const duration = 600;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeOut(progress);
      const nextStats: LearningStats = {
        total_courses: Math.round(startStats.total_courses + (targetStats.total_courses - startStats.total_courses) * eased),
        total_students: Math.round(startStats.total_students + (targetStats.total_students - startStats.total_students) * eased),
        average_rating: Number((startStats.average_rating + (targetStats.average_rating - startStats.average_rating) * eased).toFixed(1)),
        total_duration: Math.round(startStats.total_duration + (targetStats.total_duration - startStats.total_duration) * eased),
      };
      displayStatsRef.current = nextStats;
      setDisplayStats(nextStats);
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [learningStats]);

  const filteredCourses = courses;

  const handleCourseClick = (courseId: string) => {
    navigate(`/education/courses/${courseId}`);
  };

  const handleStartLearning = () => {
    const firstCourse = courses[0];
    if (firstCourse) {
      navigate(`/education/courses/${firstCourse.id}`);
      return;
    }
    courseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isCoursesLoading && courses.length === 0) {
    return <EducationLoading message="正在加载课程数据..." />;
  }

  return (
    <div className="education-page h-full overflow-y-auto bg-background">
      <div className="p-3 space-y-4 max-w-6xl mx-auto">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">智能体教学中心</h1>
                <p className="text-[11px] text-muted-foreground">
                  从零开始，掌握智能体开发技能，成为 AI 时代的技术专家
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5">平台内教学</Badge>
          </div>

          <Card>
            <CardContent className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xl font-semibold text-foreground">{displayStats.total_courses}</div>
                <div className="text-[11px] text-muted-foreground">精品课程</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">{displayStats.total_students.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">学习人数</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">{displayStats.average_rating.toFixed(1)}</div>
                <div className="text-[11px] text-muted-foreground">平均评分</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">{displayStats.total_duration}</div>
                <div className="text-[11px] text-muted-foreground">总时长(分钟)</div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* 快速入口 */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Play className="w-4 h-4 text-primary" />
            快速开始
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <Button 
              onClick={handleStartLearning}
              className="flex-1 h-9 text-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              进入教学界面
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/education/progress')}
              className="flex-1 h-9 text-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              查看学习进度
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/education/practice')}
              className="flex-1 h-9 text-sm"
            >
              <Target className="w-4 h-4 mr-2" />
              实践环境
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 课程筛选 */}
      <section ref={courseSectionRef}>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div onClick={() => handleCourseClick(course.id)}>
                  {/* 课程缩略图 */}
                  <div className="relative h-32 overflow-hidden rounded-t-md bg-slate-900">
                    <img
                      src={course.thumbnail || defaultCover}
                      alt={`${course.title} 课程封面`}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                    <div className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80">
                      AI Agent
                    </div>
                  </div>

                  {/* 课程信息 */}
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {levelLabels[course.level]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {course.category === 'theory' ? '理论' : '实践'}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                      {course.description}
                    </p>

                    {/* 讲师信息 */}
                    {course.instructor && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">智</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{course.instructor}</span>
                      </div>
                    )}

                    {/* 课程统计 */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration} 分钟
                      </span>
                      {course.studentsCount && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {course.studentsCount.toLocaleString()}
                        </span>
                      )}
                      {course.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </span>
                      )}
                    </div>

                    {/* 标签 */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="gray" className="text-[10px] px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <Button 
                      className="w-full h-8 text-xs"
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

      </div>
    </div>
  );
}
