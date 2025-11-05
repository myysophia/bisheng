import React, { useState } from 'react';
import { Play, BookOpen, Award, Users, Clock, Star } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { cn } from '~/utils';

export default function EducationDemo() {
  const [activeDemo, setActiveDemo] = useState<'overview' | 'video' | 'practice' | 'progress'>('overview');

  const demoFeatures = [
    {
      id: 'overview',
      title: '课程中心',
      description: '浏览所有智能体课程，按难度和类型筛选',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      preview: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '入门学习路径', icon: '🌱', courses: 1 },
              { title: '进阶学习路径', icon: '🚀', courses: 2 },
              { title: '实战学习路径', icon: '🎯', courses: 3 }
            ].map((path, index) => (
              <Card key={index} className="p-4 text-center">
                <div className="text-3xl mb-2">{path.icon}</div>
                <h4 className="font-semibold text-sm mb-1">{path.title}</h4>
                <p className="text-xs text-text-secondary">{path.courses} 门课程</p>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '智能体基础入门', level: '入门', students: 1234, rating: 4.8 },
              { title: '智能体进阶技术', level: '进阶', students: 856, rating: 4.9 }
            ].map((course, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{course.title}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    {course.level}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {(course.students || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'video',
      title: '视频学习',
      description: '高质量视频课程，支持数字人互动答疑',
      icon: <Play className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      preview: (
        <div className="space-y-4">
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center relative">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <h4 className="text-lg font-semibold mb-2">第1节：智能体基础概念</h4>
              <p className="text-sm opacity-80">10分钟 · 数字人导师讲解</p>
            </div>
            {/* 模拟聊天面板 */}
            <div className="absolute top-4 right-4 w-64 h-48 bg-white rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">智</span>
                </div>
                <span className="text-sm font-medium">数字人导师</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-gray-100 p-2 rounded">
                  你好！有什么问题可以随时问我
                </div>
                <div className="bg-blue-500 text-white p-2 rounded ml-8">
                  什么是智能体？
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  智能体是能够感知环境、做出决策并执行行动的自主系统...
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((chapter) => (
              <div key={chapter} className={cn(
                "p-2 rounded text-center text-xs",
                chapter === 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              )}>
                第{chapter}节
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'practice',
      title: '实践环境',
      description: '可视化工作流编辑器，拖拽式智能体搭建',
      icon: <Award className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      preview: (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 min-h-48 relative">
            {/* 模拟工作流节点 */}
            <div className="absolute top-4 left-4 w-20 h-16 bg-blue-100 text-blue-700 rounded-lg flex flex-col items-center justify-center text-xs">
              <span className="text-lg mb-1">📥</span>
              <span>用户输入</span>
            </div>
            <div className="absolute top-4 left-32 w-20 h-16 bg-purple-100 text-purple-700 rounded-lg flex flex-col items-center justify-center text-xs">
              <span className="text-lg mb-1">🤖</span>
              <span>LLM处理</span>
            </div>
            <div className="absolute top-4 left-60 w-20 h-16 bg-red-100 text-red-700 rounded-lg flex flex-col items-center justify-center text-xs">
              <span className="text-lg mb-1">📤</span>
              <span>输出结果</span>
            </div>
            {/* 连接线 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="84" y1="32" x2="128" y2="32" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="212" y1="32" x2="256" y2="32" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
            </svg>
            
            {/* 工具面板 */}
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded border p-2">
              <div className="flex gap-2 text-xs">
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded">📥 输入</div>
                <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded">🤖 LLM</div>
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded">💬 提示词</div>
                <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded">🔧 工具</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">保存</Button>
            <Button size="sm" variant="submit">测试运行</Button>
          </div>
        </div>
      )
    },
    {
      id: 'progress',
      title: '学习进度',
      description: '详细的学习统计和成就系统',
      icon: <Users className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600',
      preview: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">完成率</p>
                  <p className="text-xl font-bold text-text-primary">67%</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">学习时长</p>
                  <p className="text-xl font-bold text-text-primary">180</p>
                  <p className="text-xs text-text-secondary">分钟</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3">学习成就</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '🎓', title: '初学者', unlocked: true },
                { icon: '⚡', title: '学习达人', unlocked: true },
                { icon: '💯', title: '完美主义者', unlocked: false },
                { icon: '🏆', title: '实践大师', unlocked: false }
              ].map((achievement, index) => (
                <div key={index} className={cn(
                  "flex items-center gap-2 p-2 rounded text-xs",
                  achievement.unlocked 
                    ? "bg-green-50 text-green-700" 
                    : "bg-gray-50 text-gray-400"
                )}>
                  <span className={achievement.unlocked ? '' : 'grayscale'}>
                    {achievement.icon}
                  </span>
                  <span>{achievement.title}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="education-demo">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          功能演示
        </h2>
        <p className="text-text-secondary">
          体验智能体教学平台的核心功能
        </p>
      </div>

      {/* 功能选择器 */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {demoFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveDemo(feature.id as any)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              activeDemo === feature.id
                ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                : "bg-white border border-border-light hover:shadow-md"
            )}
          >
            {feature.icon}
            <div className="text-left">
              <div className="font-semibold text-sm">{feature.title}</div>
              <div className={cn(
                "text-xs",
                activeDemo === feature.id ? "text-white/80" : "text-text-secondary"
              )}>
                {feature.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 功能预览 */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {demoFeatures.find(f => f.id === activeDemo)?.title}
          </h3>
          <p className="text-text-secondary text-sm">
            {demoFeatures.find(f => f.id === activeDemo)?.description}
          </p>
        </div>
        
        <div className="demo-preview">
          {demoFeatures.find(f => f.id === activeDemo)?.preview}
        </div>
      </Card>
    </div>
  );
}





