import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  Download, 
  Share2,
  Settings,
  Play,
  Target,
  Users,
  BookOpen
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';

export default function CreationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="creation-success max-w-4xl mx-auto px-4 py-8">
      {/* 成功提示 */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 智能体创建成功！
        </h1>
        <p className="text-lg text-gray-600">
          恭喜您完成了13步引导流程，您的专属智能体已经准备就绪
        </p>
      </div>

      {/* 智能体信息卡片 */}
      <Card className="p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              我的智能助手 v1.0.0
            </h2>
            <p className="text-gray-600 mb-4">
              一个专业的AI助手，能够处理各种日常问题和任务，具备友好的交互方式和可靠的服务能力。
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                通用助手
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                GPT-3.5 Turbo
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                中文优化
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 功能特性 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-4 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">智能配置</h3>
          <p className="text-sm text-gray-600">
            基于您的需求自动优化参数配置
          </p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">安全可靠</h3>
          <p className="text-sm text-gray-600">
            内置安全防护和隐私保护机制
          </p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">即用即得</h3>
          <p className="text-sm text-gray-600">
            无需额外配置，立即开始使用
          </p>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button 
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => navigate('/agents')}
        >
          <Play className="w-5 h-5 mr-2" />
          立即使用智能体
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate('/education/guided-builder')}
        >
          <Settings className="w-5 h-5 mr-2" />
          继续优化配置
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          导出配置
        </Button>
      </div>

      {/* 下一步建议 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          接下来您可以：
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">测试智能体功能</h4>
              <p className="text-sm text-gray-600">在对话界面中测试各种场景和问题</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">学习更多课程</h4>
              <p className="text-sm text-gray-600">继续学习高级功能和最佳实践</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">分享给团队</h4>
              <p className="text-sm text-gray-600">邀请团队成员一起使用和优化</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">创建更多智能体</h4>
              <p className="text-sm text-gray-600">为不同场景创建专门的智能体</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}