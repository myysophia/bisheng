import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Star, TrendingUp, Award, Play, ArrowRight } from 'lucide-react';

export default function EducationPage() {
  const navigate = useNavigate();
  const [learningStats, setLearningStats] = useState({
    total_courses: 3,
    total_students: 2522,
    average_rating: 4.8,
    total_duration: 280
  });

  // 模拟学习路径数据
  const learningPaths = [
    {
      id: 'beginner',
      title: '入门学习路径',
      description: '适合零基础学员，从基础概念开始学习',
      icon: '🌱',
      estimatedTime: '1-2周',
      courses: ['course-1'],
      level: 'beginner'
    },
    {
      id: 'intermediate',
      title: '进阶学习路径',
      description: '适合有一定基础的学员，深入学习高级技术',
      icon: '🚀',
      estimatedTime: '2-3周',
      courses: ['course-2'],
      level: 'intermediate'
    },
    {
      id: 'advanced',
      title: '实战学习路径',
      description: '适合希望进行实际项目实战提升技能',
      icon: '🎯',
      estimatedTime: '4-6周',
      courses: ['course-3'],
      level: 'advanced'
    }
  ];

  // 模拟成就数据
  const achievements = [
    { id: 1, title: '初学者', description: '完成第一个课程', icon: '🏆' },
    { id: 2, title: '进阶者', description: '完成5个课程', icon: '🥇' },
    { id: 3, title: '专家', description: '完成所有课程', icon: '👑' },
    { id: 4, title: '分享者', description: '分享学习心得', icon: '📢' }
  ];

  const handleStartLearning = () => {
    // 确保token同步到客户端可以访问的key
    const wsToken = localStorage.getItem('ws_token');
    const testToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ7XCJ1c2VyX25hbWVcIjogXCJ0ZXN0QDEyMy5jb21cIiwgXCJ1c2VyX2lkXCI6IDEsIFwicm9sZVwiOiBcImFkbWluXCJ9IiwiaWF0IjoxNzYyMTU2OTY5LCJuYmYiOjE3NjIxNTY5NjksImp0aSI6ImIxZWQ2YmU1LTA2MWYtNDM4YS1iYTYyLWVkZGJhZGRjZjA3ZiIsImV4cCI6MTc2MjI0MzM2OSwidHlwZSI6ImFjY2VzcyIsImZyZXNoIjpmYWxzZX0.uhK_bJ6lQHym38xkP7n_l2H1rxGsTPPUM6ErjMzHbP8';
    
    console.log('🔧 平台前端：准备跳转到教学页面');
    
    if (wsToken) {
      // 同步token到客户端使用的key
      localStorage.setItem('token', wsToken);
      console.log('✅ 使用平台token:', wsToken.substring(0, 20) + '...');
    } else {
      // 如果没有平台token，设置测试token
      localStorage.setItem('ws_token', testToken);
      localStorage.setItem('token', testToken);
      console.log('✅ 设置测试token');
    }
    
    // 设置用户信息和教育演示模式
    const testUser = {
      user_name: 'test@123.com',
      user_id: 1,
      role: 'admin'
    };
    localStorage.setItem('user', JSON.stringify(testUser));
    localStorage.setItem('educationDemoMode', 'true');
    
    console.log('🚀 跳转到客户端教学页面');
    
    // 跳转到客户端的教学页面
    window.open('http://localhost:4001/workspace/education', '_blank');
  };

  const handleCourseClick = (courseId: string) => {
    // 确保token同步
    const wsToken = localStorage.getItem('ws_token');
    if (wsToken) {
      localStorage.setItem('token', wsToken);
    }
    
    // 跳转到具体课程
    window.open(`http://localhost:4001/workspace/education/courses/${courseId}`, '_blank');
  };

  return (
    <div className="education-page max-w-7xl mx-auto px-6 py-8">
      {/* 头部横幅 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              智能体教学中心
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              从零开始，掌握智能体开发技能，成为AI时代的技术专家
            </p>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{learningStats.total_courses}</div>
            <div className="text-sm text-gray-500">精品课程</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{learningStats.total_students.toLocaleString()}</div>
            <div className="text-sm text-gray-500">学习人数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{learningStats.average_rating}</div>
            <div className="text-sm text-gray-500">平均评分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{learningStats.total_duration}</div>
            <div className="text-sm text-gray-500">总时长(分钟)</div>
          </div>
        </div>
      </div>

      {/* 快速开始 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Play className="w-6 h-6 text-blue-600" />
          快速开始
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                进入教学页面
              </h3>
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              开始您的智能体学习之旅，体验交互式教学内容
            </p>
            <button
              onClick={handleStartLearning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              进入教学页面
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                查看学习进度
              </h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              查看您的学习进度和已获得的成就
            </p>
            <button
              onClick={() => {
                // 确保token同步
                const wsToken = localStorage.getItem('ws_token');
                if (wsToken) {
                  localStorage.setItem('token', wsToken);
                }
                window.open('http://localhost:4001/workspace/education/progress', '_blank');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              查看学习进度
            </button>
          </div>
        </div>
      </section>

      {/* 学习路径 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          推荐学习路径
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningPaths.map((path) => (
            <div key={path.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">{path.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {path.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  {path.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {path.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {path.courses.length} 门课程
                  </span>
                </div>
                <button 
                  onClick={() => handleCourseClick(path.courses[0])}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  开始学习
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 成就系统预览 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-600" />
          学习成就
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {achievement.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}