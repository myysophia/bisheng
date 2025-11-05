// 引导式构建器的13个步骤数据
export const guidedStepsData = {
  steps: [
    {
      id: 'step-1',
      title: '智能体基本信息',
      description: '设置智能体的名称、描述和基本属性',
      focus_element: '#agent-basic-info',
      instructions: '首先为您的智能体起一个有意义的名称，并详细描述它的功能和用途。这将帮助用户更好地理解智能体的能力。'
    },
    {
      id: 'step-2',
      title: '定义智能体角色',
      description: '设置智能体的角色定位和专业领域',
      focus_element: '#agent-role-config',
      instructions: '选择或自定义智能体的角色，这将决定它的行为模式和专业知识领域。您可以选择预设角色或创建自定义角色。'
    },
    {
      id: 'step-3',
      title: '配置系统提示词',
      description: '编写智能体的核心指令和行为准则',
      focus_element: '#system-prompt-config',
      instructions: '系统提示词是智能体的大脑，它定义了智能体的基本行为模式、回应风格和核心原则。请仔细编写以确保智能体按预期工作。'
    },
    {
      id: 'step-4',
      title: '选择语言模型',
      description: '选择适合的AI语言模型',
      focus_element: '#model-selection',
      instructions: '根据您的需求选择合适的语言模型。不同模型在性能、成本和功能上有所差异，请根据实际应用场景选择。'
    },
    {
      id: 'step-5',
      title: '设置模型参数',
      description: '调整模型的运行参数',
      focus_element: '#model-parameters',
      instructions: '调整温度、最大令牌数等参数来优化智能体的表现。这些参数会影响回答的创造性、长度和一致性。'
    },
    {
      id: 'step-6',
      title: '配置知识库',
      description: '添加专业知识和文档',
      focus_element: '#knowledge-base',
      instructions: '上传相关文档和资料，为智能体提供专业知识支持。这将大大提升智能体在特定领域的回答质量。'
    },
    {
      id: 'step-7',
      title: '设置工具集成',
      description: '配置外部工具和API',
      focus_element: '#tools-integration',
      instructions: '集成外部工具和API，让智能体能够执行更复杂的任务，如搜索、计算、数据处理等。'
    },
    {
      id: 'step-8',
      title: '配置对话流程',
      description: '设计对话的逻辑和流程',
      focus_element: '#conversation-flow',
      instructions: '定义对话的开始、进行和结束流程，包括欢迎语、常见问题处理和异常情况应对。'
    },
    {
      id: 'step-9',
      title: '安全与合规设置',
      description: '配置安全策略和合规要求',
      focus_element: '#security-compliance',
      instructions: '设置内容过滤、隐私保护和合规检查规则，确保智能体的输出符合相关法规和企业政策。'
    },
    {
      id: 'step-10',
      title: '测试与验证',
      description: '测试智能体的功能和性能',
      focus_element: '#testing-validation',
      instructions: '通过多种测试场景验证智能体的功能是否正常，包括基础对话、专业问答和异常处理。'
    },
    {
      id: 'step-11',
      title: '性能优化',
      description: '优化响应速度和质量',
      focus_element: '#performance-optimization',
      instructions: '根据测试结果调整配置，优化智能体的响应速度、准确性和用户体验。'
    },
    {
      id: 'step-12',
      title: '部署配置',
      description: '设置部署环境和访问权限',
      focus_element: '#deployment-config',
      instructions: '配置智能体的部署环境、访问权限和使用限制，确保安全可控的服务提供。'
    },
    {
      id: 'step-13',
      title: '监控与维护',
      description: '设置监控指标和维护计划',
      focus_element: '#monitoring-maintenance',
      instructions: '配置性能监控、日志记录和定期维护计划，确保智能体的长期稳定运行。'
    }
  ]
};

// 进度摘要示例数据
export const progressSummaryData = {
  total_steps: 13,
  completed_steps: ['step-1', 'step-2'],
  current_step: 'step-3',
  completion_percentage: 15.4
};

// 学习统计示例数据
export const learningStatsData = {
  total_courses: 25,
  total_students: 1250,
  average_rating: 4.7,
  total_duration: 180
};