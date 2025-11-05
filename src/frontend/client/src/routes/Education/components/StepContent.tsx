import React from 'react';
import { 
  User, 
  MessageSquare, 
  Brain, 
  Sliders, 
  FileText, 
  ArrowUpDown, 
  Wrench, 
  Database, 
  Shield, 
  TestTube, 
  Cloud, 
  CheckCircle,
  Settings
} from 'lucide-react';
import { Input } from '~/components/ui/Input';
import { Textarea } from '~/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Switch } from '~/components/ui/Switch';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { cn } from '~/utils';

interface GuidedStep {
  id: string;
  title: string;
  description: string;
  focus_element: string;
  instructions: string;
}

interface StepConfig {
  [key: string]: any;
}

interface StepContentProps {
  step: GuidedStep;
  config: StepConfig;
  onConfigChange: (config: StepConfig) => void;
}

const StepContent: React.FC<StepContentProps> = ({ step, config, onConfigChange }) => {
  const updateConfig = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'step-1': // 智能体基本信息
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">基本信息设置</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  智能体名称 *
                </label>
                <Input
                  placeholder="例如：客服助手、技术顾问"
                  value={config.name || ''}
                  onChange={(e) => updateConfig('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版本号
                </label>
                <Input
                  placeholder="例如：v1.0.0"
                  value={config.version || 'v1.0.0'}
                  onChange={(e) => updateConfig('version', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                功能描述 *
              </label>
              <Textarea
                placeholder="详细描述您的智能体的功能和用途..."
                rows={4}
                value={config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  应用场景
                </label>
                <Select
                  value={config.scenario || ''}
                  onValueChange={(value) => updateConfig('scenario', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择应用场景" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer-service">客户服务</SelectItem>
                    <SelectItem value="technical-support">技术支持</SelectItem>
                    <SelectItem value="content-creation">内容创作</SelectItem>
                    <SelectItem value="data-analysis">数据分析</SelectItem>
                    <SelectItem value="education">教育培训</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预期用户群体
                </label>
                <Input
                  placeholder="例如：企业客户、学生、开发者"
                  value={config.target_users || ''}
                  onChange={(e) => updateConfig('target_users', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'step-2': // 定义智能体角色
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">角色定位设置</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择预设角色
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'assistant', name: '通用助手', desc: '处理各种日常问题' },
                  { id: 'customer-service', name: '客服专员', desc: '专业客户服务' },
                  { id: 'technical-expert', name: '技术专家', desc: '技术问题解答' },
                  { id: 'content-creator', name: '内容创作者', desc: '文案和创意' },
                  { id: 'data-analyst', name: '数据分析师', desc: '数据处理分析' },
                  { id: 'custom', name: '自定义角色', desc: '创建专属角色' }
                ].map((role) => (
                  <Card
                    key={role.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors border-2",
                      config.role === role.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => updateConfig('role', role.id)}
                  >
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{role.desc}</div>
                  </Card>
                ))}
              </div>
            </div>
            
            {config.role === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自定义角色描述
                </label>
                <Textarea
                  placeholder="详细描述您的智能体应该扮演什么角色..."
                  rows={3}
                  value={config.custom_role || ''}
                  onChange={(e) => updateConfig('custom_role', e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专业领域
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  '人工智能', '软件开发', '数据科学', '产品设计', 
                  '市场营销', '客户服务', '教育培训', '金融服务',
                  '医疗健康', '法律咨询', '创意写作', '项目管理'
                ].map((domain) => (
                  <Button
                    key={domain}
                    variant={config.domains?.includes(domain) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const domains = config.domains || [];
                      const newDomains = domains.includes(domain)
                        ? domains.filter((d: string) => d !== domain)
                        : [...domains, domain];
                      updateConfig('domains', newDomains);
                    }}
                  >
                    {domain}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'step-3': // 配置系统提示词
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">系统提示词配置</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                系统提示词 *
              </label>
              <Textarea
                placeholder="你是一个专业的AI助手，请遵循以下原则：&#10;1. 始终保持友好和专业的态度&#10;2. 提供准确、有用的信息&#10;3. 如果不确定答案，请诚实说明&#10;4. 尊重用户隐私和数据安全..."
                rows={8}
                value={config.system_prompt || ''}
                onChange={(e) => updateConfig('system_prompt', e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">
                系统提示词将决定智能体的基本行为模式和回应风格
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回应风格
                </label>
                <Select
                  value={config.response_style || ''}
                  onValueChange={(value) => updateConfig('response_style', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择回应风格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">专业正式</SelectItem>
                    <SelectItem value="friendly">友好亲切</SelectItem>
                    <SelectItem value="casual">轻松随意</SelectItem>
                    <SelectItem value="technical">技术专业</SelectItem>
                    <SelectItem value="creative">创意活泼</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言偏好
                </label>
                <Select
                  value={config.language || 'zh-CN'}
                  onValueChange={(value) => updateConfig('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-CN">中文（简体）</SelectItem>
                    <SelectItem value="zh-TW">中文（繁体）</SelectItem>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="ja-JP">日本語</SelectItem>
                    <SelectItem value="ko-KR">한국어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                行为准则
              </label>
              <div className="space-y-2">
                {[
                  { key: 'ethical', label: '遵循道德和法律规范' },
                  { key: 'privacy', label: '保护用户隐私' },
                  { key: 'accuracy', label: '确保信息准确性' },
                  { key: 'helpful', label: '提供有用的帮助' },
                  { key: 'respectful', label: '保持尊重和礼貌' }
                ].map((rule) => (
                  <div key={rule.key} className="flex items-center gap-3">
                    <Switch
                      checked={config.rules?.[rule.key] !== false}
                      onCheckedChange={(checked) => {
                        const rules = config.rules || {};
                        updateConfig('rules', { ...rules, [rule.key]: checked });
                      }}
                    />
                    <label className="text-sm text-gray-700">{rule.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'step-4': // 选择语言模型
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">语言模型选择</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择语言模型 *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: 'gpt-4',
                    name: 'GPT-4',
                    provider: 'OpenAI',
                    description: '最强大的通用语言模型，适合复杂推理任务',
                    features: ['强大推理能力', '多语言支持', '代码生成'],
                    cost: '高'
                  },
                  {
                    id: 'gpt-3.5-turbo',
                    name: 'GPT-3.5 Turbo',
                    provider: 'OpenAI',
                    description: '性价比优秀的模型，适合大多数应用场景',
                    features: ['快速响应', '成本较低', '稳定可靠'],
                    cost: '中'
                  },
                  {
                    id: 'claude-3',
                    name: 'Claude-3',
                    provider: 'Anthropic',
                    description: '擅长长文本处理和安全对话',
                    features: ['长文本处理', '安全可靠', '逻辑清晰'],
                    cost: '中'
                  },
                  {
                    id: 'qwen-max',
                    name: '通义千问 Max',
                    provider: '阿里云',
                    description: '国产大模型，中文理解能力强',
                    features: ['中文优化', '本土化', '合规安全'],
                    cost: '低'
                  }
                ].map((model) => (
                  <Card
                    key={model.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors border-2",
                      config.model === model.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => updateConfig('model', model.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{model.name}</div>
                        <div className="text-xs text-gray-500">{model.provider}</div>
                      </div>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded",
                        model.cost === '高' && "bg-red-100 text-red-700",
                        model.cost === '中' && "bg-yellow-100 text-yellow-700",
                        model.cost === '低' && "bg-green-100 text-green-700"
                      )}>
                        成本{model.cost}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {model.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            {config.model && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">模型配置建议</h4>
                <div className="text-sm text-blue-800">
                  {config.model === 'gpt-4' && '建议用于需要复杂推理和高质量输出的场景'}
                  {config.model === 'gpt-3.5-turbo' && '适合大多数日常对话和任务处理场景'}
                  {config.model === 'claude-3' && '推荐用于需要处理长文档或注重安全性的场景'}
                  {config.model === 'qwen-max' && '适合中文为主的应用场景，具有良好的本土化支持'}
                </div>
              </div>
            )}
          </div>
        );

      case 'step-5': // 设置模型参数
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">模型参数调整</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  温度 (Temperature): {config.temperature || 0.7}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature || 0.7}
                  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>保守 (0.0)</span>
                  <span>平衡 (1.0)</span>
                  <span>创新 (2.0)</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  控制输出的随机性和创造性。较低值产生更一致的回答，较高值产生更多样化的回答。
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大令牌数: {config.max_tokens || 2048}
                </label>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={config.max_tokens || 2048}
                  onChange={(e) => updateConfig('max_tokens', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>256</span>
                  <span>2048</span>
                  <span>4096</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  限制单次回复的最大长度。更高的值允许更长的回答，但会增加成本。
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top P: {config.top_p || 1.0}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={config.top_p || 1.0}
                  onChange={(e) => updateConfig('top_p', parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  核心采样参数，控制考虑的词汇范围。较低值使输出更集中。
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  频率惩罚: {config.frequency_penalty || 0.0}
                </label>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.1"
                  value={config.frequency_penalty || 0.0}
                  onChange={(e) => updateConfig('frequency_penalty', parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  减少重复内容的出现。正值减少重复，负值增加重复。
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">参数调整建议</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• <strong>客服场景</strong>：温度 0.3-0.5，确保回答一致性</p>
                <p>• <strong>创作场景</strong>：温度 0.7-1.2，增加创造性</p>
                <p>• <strong>技术问答</strong>：温度 0.2-0.4，确保准确性</p>
                <p>• <strong>日常对话</strong>：温度 0.6-0.8，平衡一致性和多样性</p>
              </div>
            </div>
          </div>
        );

      default:
        // 为其他步骤提供通用的配置界面
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">配置设置</h3>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {step.title}
              </h4>
              <p className="text-gray-600 mb-4">
                {step.description}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-800">
                  <strong>操作指引：</strong> {step.instructions}
                </p>
              </div>
              
              {/* 通用配置选项 */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配置说明
                  </label>
                  <Textarea
                    placeholder="请输入此步骤的配置说明或备注..."
                    rows={3}
                    value={config.notes || ''}
                    onChange={(e) => updateConfig('notes', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.enabled !== false}
                    onCheckedChange={(checked) => updateConfig('enabled', checked)}
                  />
                  <label className="text-sm text-gray-700">
                    启用此配置步骤
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="step-content">
      {renderStepContent()}
    </div>
  );
};

export default StepContent;