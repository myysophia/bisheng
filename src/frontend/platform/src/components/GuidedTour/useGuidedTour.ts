import { useState, useCallback, useEffect } from 'react';
import { GuidedStep, GuidedTourState } from './types';

export const useGuidedTour = (steps: GuidedStep[]) => {
  const [state, setState] = useState<GuidedTourState>({
    isActive: false,
    currentStep: 0,
    totalSteps: steps.length,
    completedSteps: new Set(),
    userProgress: {
      nodesCreated: 0,
      connectionsCreated: 0,
      configurationsSaved: 0
    }
  });

  // 开始引导
  const startTour = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      completedSteps: new Set()
    }));
  }, []);

  // 下一步
  const nextStep = useCallback(() => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(prev.currentStep);
      
      return {
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1),
        completedSteps: newCompletedSteps
      };
    });
  }, []);

  // 上一步
  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  }, []);

  // 跳过引导
  const skipTour = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 0
    }));
  }, []);

  // 完成引导
  const completeTour = useCallback(() => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(prev.currentStep);
      
      return {
        ...prev,
        isActive: false,
        completedSteps: newCompletedSteps
      };
    });
  }, []);

  // 更新用户进度
  const updateProgress = useCallback((key: keyof GuidedTourState['userProgress'], value: number) => {
    setState(prev => ({
      ...prev,
      userProgress: {
        ...prev.userProgress,
        [key]: value
      }
    }));
  }, []);

  // 跳转到指定步骤
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setState(prev => ({
        ...prev,
        currentStep: stepIndex
      }));
    }
  }, [steps.length]);

  // 检查步骤是否完成
  const isStepCompleted = useCallback((stepIndex: number) => {
    return state.completedSteps.has(stepIndex);
  }, [state.completedSteps]);

  // 获取当前步骤数据
  const getCurrentStep = useCallback(() => {
    return steps[state.currentStep] || null;
  }, [steps, state.currentStep]);

  // 监听DOM变化来自动验证步骤完成
  useEffect(() => {
    if (!state.isActive) return;

    const currentStepData = getCurrentStep();
    if (!currentStepData?.validation) return;

    const checkValidation = () => {
      if (currentStepData.validation && currentStepData.validation()) {
        // 自动进入下一步（可选）
        // nextStep();
      }
    };

    // 监听DOM变化
    const observer = new MutationObserver(checkValidation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => observer.disconnect();
  }, [state.isActive, state.currentStep, getCurrentStep]);

  return {
    state,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    updateProgress,
    goToStep,
    isStepCompleted,
    getCurrentStep
  };
};