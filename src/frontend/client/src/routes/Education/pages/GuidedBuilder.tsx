import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, BookOpen, Settings, Lightbulb, Target, Save } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { cn } from '~/utils';
import useEducationAPI from '~/hooks/Education/useEducationAPI';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorBoundary';
import StepContent from '../components/StepContent';

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

export default function GuidedBuilder() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<GuidedStep[]>([]);
  const [stepConfigs, setStepConfigs] = useState<Record<string, StepConfig>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { guidedStepsState, fetchGuidedSteps, saveGuidedProgress, fetchProgressSummary } = useEducationAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchGuidedSteps();
        const summary = await fetchProgressSummary();
        
        if (guidedStepsState.data?.steps) {
          setSteps(guidedStepsState.data.steps);
        }
        
        if (summary?.completed_steps) {
          setCompletedSteps(new Set(summary.completed_steps));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载引导数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchGuidedSteps, fetchProgressSummary, guidedStepsState.data]);

  const currentStep = steps[currentStepIndex];

  if (isLoading) {
    return (
      <div className="guided-builder max-w-6xl mx-auto px-4 py-8">
        <LoadingSpinner size="lg" message="正在加载引导流程..." />
      </div>
    );
  }

  return (
    <div className="guided-builder max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">引导式智能体创建</h1>
      
      {currentStep && (
        <StepContent 
          step={currentStep}
          config={stepConfigs[currentStep.id] || {}}
          onConfigChange={(config) => {
            setStepConfigs(prev => ({ ...prev, [currentStep.id]: config }));
          }}
        />
      )}
      
      <div className="mt-8">
        <Button onClick={() => navigate('/education/success')}>
          完成创建
        </Button>
      </div>
    </div>
  );
}