import { GuidedStep } from './types';

// 工作流引导步骤定义
export const workflowGuidedSteps: GuidedStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用工作流编辑器',
    description: '我将引导您创建第一个工作流。工作流是由多个节点组成的处理流程，数据从一个节点流向另一个节点。',
    target: '.react-flow',
    position: 'center',
    action: 'observe',
    highlight: false,
    nextEnabled: true,
    skipEnabled: true
  },
  {
    id: 'sidebar-intro',
    title: '认识组件库',
    description: '左侧是组件库，包含了各种类型的节点。您可以拖拽这些节点到画布上来构建工作流。',
    target: '.flow-sidebar',
    position: 'right',
    action: 'observe',
    highlight: true,
    nextEnabled: true
  },
  {
    id: 'drag-input-node',
    title: '添加输入节点',
    description: '让我们从添加一个"输入"节点开始。请从左侧组件库中拖拽"输入"节点到画布中央。',
    target: '.flow-sidebar button:first-child',
    position: 'right',
    action: 'drag',
    highlight: true
  },
  {
    id: 'drag-llm-node',
    title: '添加大模型节点',
    description: '很好！现在让我们添加一个"大模型"节点。请拖拽大模型节点到输入节点的右侧。',
    target: '.flow-sidebar',
    position: 'right',
    action: 'drag',
    highlight: true
  },
  {
    id: 'connect-nodes',
    title: '连接节点',
    description: '现在我们需要连接这两个节点。将鼠标悬停在输入节点上，您会看到连接点。拖拽连接点到大模型节点来建立连接。',
    target: '.react-flow',
    position: 'center',
    action: 'connect',
    highlight: false
  },
  {
    id: 'add-output-node',
    title: '添加输出节点',
    description: '让我们添加一个"输出"节点来完成这个简单的工作流。请拖拽输出节点到大模型节点的右侧。',
    target: '.flow-sidebar',
    position: 'right',
    action: 'drag',
    highlight: true
  },
  {
    id: 'connect-output',
    title: '连接输出节点',
    description: '请将大模型节点连接到输出节点，完成整个数据流。',
    target: '.react-flow',
    position: 'center',
    action: 'connect',
    highlight: false
  },
  {
    id: 'configure-node',
    title: '配置节点参数',
    description: '点击大模型节点来打开配置面板。您可以在这里设置模型参数、提示词等。',
    target: '.react-flow',
    position: 'center',
    action: 'click',
    highlight: false
  },
  {
    id: 'save-workflow',
    title: '保存工作流',
    description: '恭喜！您已经创建了第一个工作流。现在让我们保存它。点击顶部的"保存"按钮。',
    target: '.react-flow',
    position: 'center',
    action: 'observe',
    highlight: false
  },
  {
    id: 'test-workflow',
    title: '测试运行',
    description: '最后，让我们测试一下工作流。点击顶部的"运行"按钮来测试您创建的工作流。',
    target: '.react-flow',
    position: 'center',
    action: 'observe',
    highlight: false
  },
  {
    id: 'completion',
    title: '完成！',
    description: '🎉 恭喜您！您已经学习了工作流的基本创建流程。现在您可以继续探索更多高级功能，或者创建更复杂的工作流。',
    target: '.react-flow',
    position: 'center',
    action: 'observe',
    highlight: false,
    skipEnabled: false
  }
];