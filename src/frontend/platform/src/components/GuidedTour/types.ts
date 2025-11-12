// 引导系统类型定义
export interface GuidedStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action: 'click' | 'drag' | 'input' | 'observe' | 'connect';
  highlight: boolean;
  validation?: () => boolean;
  onComplete?: () => void;
  nextEnabled?: boolean;
  skipEnabled?: boolean;
}

export interface GuidedTourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  userProgress: {
    nodesCreated: number;
    connectionsCreated: number;
    configurationsSaved: number;
  };
}

export interface GuidedTourProps {
  steps: GuidedStep[];
  isActive: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}