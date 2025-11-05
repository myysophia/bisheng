import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Eye,
  Code,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { cn } from '~/utils';

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  config: Record<string, any>;
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
}

export default function PracticeEnvironment() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'input-1',
      type: 'input',
      label: '用户输入',
      x: 100,
      y: 100,
      config: { placeholder: '请输入您的问题...' }
    },
    {
      id: 'llm-1',
      type: 'llm',
      label: 'LLM处理',
      x: 300,
      y: 100,
      config: { model: 'gpt-3.5-turbo', temperature: 0.7 }
    },
    {
      id: 'output-1',
      type: 'output',
      label: '输出结果',
      x: 500,
      y: 100,
      config: {}
    }
  ]);
  
  const [connections, setConnections] = useState<WorkflowConnection[]>([
    { id: 'conn-1', source: 'input-1', target: 'llm-1' },
    { id: 'conn-2', source: 'llm-1', target: 'output-1' }
  ]);
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 模拟作业数据
  const assignment = {
    id: assignmentId,
    title: '创建你的第一个对话智能体',
    description: '根据课程内容，创建一个简单的对话智能体，能够回答关于智能体基础概念的问题。',
    requirements: [
      '使用Bisheng平台创建智能体',
      '设置合适的Prompt',
      '测试对话功能',
      '提交工作流配置文件'
    ],
    hints: [
      '可以从模板库中选择基础对话模板开始',
      '注意设置合适的系统提示词',
      '测试多种不同类型的问题',
      '确保回答准确且有帮助'
    ]
  };

  const nodeTypes = [
    { type: 'input', label: '输入节点', icon: '📥', color: 'bg-blue-100 text-blue-700' },
    { type: 'llm', label: 'LLM节点', icon: '🤖', color: 'bg-purple-100 text-purple-700' },
    { type: 'prompt', label: '提示词', icon: '💬', color: 'bg-green-100 text-green-700' },
    { type: 'tool', label: '工具调用', icon: '🔧', color: 'bg-orange-100 text-orange-700' },
    { type: 'condition', label: '条件判断', icon: '🔀', color: 'bg-yellow-100 text-yellow-700' },
    { type: 'output', label: '输出节点', icon: '📤', color: 'bg-red-100 text-red-700' }
  ];

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setTestResult(null);
    
    // 模拟工作流执行
    setTimeout(() => {
      setTestResult({
        success: true,
        output: '你好！我是一个智能体助手。智能体是一个能够感知环境、做出决策并执行行动的自主系统。它可以帮助用户完成各种任务，比如回答问题、处理数据、自动化工作流程等。你还想了解智能体的哪些方面呢？',
        executionTime: 1.2,
        tokensUsed: 156
      });
      setIsRunning(false);
    }, 2000);
  };

  const handleSaveWorkflow = () => {
    const workflowData = {
      nodes,
      connections,
      metadata: {
        assignmentId,
        savedAt: new Date().toISOString()
      }
    };
    
    // 模拟保存
    console.log('保存工作流:', workflowData);
    alert('工作流已保存！');
  };

  const handleSubmitAssignment = () => {
    if (!testResult?.success) {
      alert('请先测试工作流确保正常运行！');
      return;
    }
    
    // 模拟提交作业
    alert('作业提交成功！等待导师评分...');
    navigate('/education');
  };

  const addNode = (type: string) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: nodeTypes.find(nt => nt.type === type)?.label || type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      config: {}
    };
    
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.source !== nodeId && c.target !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  return (
    <div className={cn(
      "practice-environment h-full flex flex-col bg-surface-primary",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-border-light px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/education')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="h-6 w-px bg-border-light" />
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                实践环境
              </h1>
              <p className="text-sm text-text-secondary">
                {assignment.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? '隐藏预览' : '预览'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveWorkflow}
            >
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
            
            <Button
              variant="submit"
              size="sm"
              onClick={handleRunWorkflow}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isRunning ? '运行中...' : '测试运行'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：工具面板 */}
        <div className="w-64 bg-white border-r border-border-light flex flex-col">
          {/* 节点库 */}
          <div className="p-4 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text-primary mb-3">组件库</h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={() => addNode(nodeType.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border-light hover:bg-surface-secondary transition-colors"
                >
                  <span className="text-lg">{nodeType.icon}</span>
                  <span className="text-sm font-medium text-text-primary">
                    {nodeType.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 作业要求 */}
          <div className="p-4 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text-primary mb-3">作业要求</h3>
            <div className="space-y-2">
              {assignment.requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 提示 */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              提示
            </h3>
            <div className="space-y-2">
              {assignment.hints.map((hint, index) => (
                <div key={index} className="p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-700">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：工作流画布 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative overflow-hidden bg-gray-50">
            <div
              ref={canvasRef}
              className="w-full h-full relative"
              style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* 渲染连接线 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((conn) => {
                  const sourceNode = nodes.find(n => n.id === conn.source);
                  const targetNode = nodes.find(n => n.id === conn.target);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  return (
                    <line
                      key={conn.id}
                      x1={sourceNode.x + 100}
                      y1={sourceNode.y + 40}
                      x2={targetNode.x}
                      y2={targetNode.y + 40}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
                
                {/* 箭头标记 */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#3b82f6"
                    />
                  </marker>
                </defs>
              </svg>

              {/* 渲染节点 */}
              {nodes.map((node) => {
                const nodeType = nodeTypes.find(nt => nt.type === node.type);
                return (
                  <div
                    key={node.id}
                    className={cn(
                      "absolute w-24 h-20 rounded-lg border-2 cursor-move flex flex-col items-center justify-center text-xs font-medium transition-all",
                      selectedNode === node.id 
                        ? "border-blue-500 shadow-lg" 
                        : "border-gray-300 hover:border-gray-400",
                      nodeType?.color || "bg-gray-100 text-gray-700"
                    )}
                    style={{
                      left: node.x,
                      top: node.y,
                    }}
                    onClick={() => setSelectedNode(node.id)}
                    onDoubleClick={() => deleteNode(node.id)}
                  >
                    <span className="text-lg mb-1">{nodeType?.icon}</span>
                    <span className="text-center leading-tight">{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 测试结果面板 */}
          {testResult && (
            <div className="border-t border-border-light bg-white p-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  testResult.success ? "bg-green-100" : "bg-red-100"
                )}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary mb-2">
                    {testResult.success ? '测试成功' : '测试失败'}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-text-secondary">{testResult.output}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-text-secondary">
                    <span>执行时间: {testResult.executionTime}s</span>
                    <span>Token使用: {testResult.tokensUsed}</span>
                  </div>
                </div>
                <Button
                  variant="submit"
                  size="sm"
                  onClick={handleSubmitAssignment}
                  disabled={!testResult.success}
                >
                  提交作业
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：属性面板 */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-border-light">
            <div className="p-4 border-b border-border-light">
              <h3 className="text-sm font-semibold text-text-primary mb-3">节点配置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    节点名称
                  </label>
                  <input
                    type="text"
                    value={nodes.find(n => n.id === selectedNode)?.label || ''}
                    onChange={(e) => {
                      setNodes(prev => prev.map(n => 
                        n.id === selectedNode ? { ...n, label: e.target.value } : n
                      ));
                    }}
                    className="w-full px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-main"
                  />
                </div>

                {/* 根据节点类型显示不同配置 */}
                {nodes.find(n => n.id === selectedNode)?.type === 'llm' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        模型选择
                      </label>
                      <select className="w-full px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-main">
                        <option>gpt-3.5-turbo</option>
                        <option>gpt-4</option>
                        <option>claude-3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        温度设置
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue="0.7"
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {nodes.find(n => n.id === selectedNode)?.type === 'prompt' && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      提示词内容
                    </label>
                    <textarea
                      rows={4}
                      placeholder="输入系统提示词..."
                      className="w-full px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-main resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteNode(selectedNode)}
                className="w-full"
              >
                删除节点
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

