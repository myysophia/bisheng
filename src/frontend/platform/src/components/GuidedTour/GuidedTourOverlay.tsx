import React, { useEffect, useState, useCallback } from 'react';
import { GuidedStep, GuidedTourProps } from './types';
import { Button } from '@/components/bs-ui/button';
import { X, ArrowLeft, ArrowRight, Target, CheckCircle } from 'lucide-react';

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuidedTourOverlay: React.FC<GuidedTourProps> = ({
  steps,
  isActive,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete
}) => {
  const [highlightPosition, setHighlightPosition] = useState<HighlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const currentStepData = steps[currentStep];

  // 计算高亮区域位置
  const calculateHighlightPosition = useCallback((target: string): HighlightPosition | null => {
    const element = document.querySelector(target);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  }, []);

  // 计算提示框位置
  const calculateTooltipPosition = useCallback((
    highlightPos: HighlightPosition,
    position: string
  ): { top: number; left: number } => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 20;

    switch (position) {
      case 'top':
        return {
          top: highlightPos.top - tooltipHeight - offset,
          left: highlightPos.left + (highlightPos.width - tooltipWidth) / 2
        };
      case 'bottom':
        return {
          top: highlightPos.top + highlightPos.height + offset,
          left: highlightPos.left + (highlightPos.width - tooltipWidth) / 2
        };
      case 'left':
        return {
          top: highlightPos.top + (highlightPos.height - tooltipHeight) / 2,
          left: highlightPos.left - tooltipWidth - offset
        };
      case 'right':
        return {
          top: highlightPos.top + (highlightPos.height - tooltipHeight) / 2,
          left: highlightPos.left + highlightPos.width + offset
        };
      case 'center':
      default:
        return {
          top: window.innerHeight / 2 - tooltipHeight / 2,
          left: window.innerWidth / 2 - tooltipWidth / 2
        };
    }
  }, []);

  // 更新位置
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updatePositions = () => {
      const highlightPos = calculateHighlightPosition(currentStepData.target);
      if (highlightPos) {
        setHighlightPosition(highlightPos);
        const tooltipPos = calculateTooltipPosition(highlightPos, currentStepData.position);
        setTooltipPosition(tooltipPos);
      }
    };

    updatePositions();
    
    // 监听窗口大小变化和滚动
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [isActive, currentStepData, calculateHighlightPosition, calculateTooltipPosition]);

  // 处理下一步
  const handleNext = useCallback(() => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      onNext();
    }
  }, [currentStep, steps.length, onNext, onComplete]);

  if (!isActive || !currentStepData) return null;

  return (
    <div className="guided-tour-overlay fixed inset-0 z-[9999] pointer-events-none">
      {/* 遮罩层 - 使用SVG mask来挖空高亮区域 */}
      {highlightPosition && currentStepData.highlight ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={onSkip}>
          <defs>
            <mask id="guided-tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={highlightPosition.left - 4}
                y={highlightPosition.top - 4}
                width={highlightPosition.width + 8}
                height={highlightPosition.height + 8}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.5)"
            mask="url(#guided-tour-mask)"
          />
        </svg>
      ) : (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"
          onClick={onSkip}
        />
      )}
      
      {/* 高亮边框 */}
      {highlightPosition && currentStepData.highlight && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: highlightPosition.top - 4,
            left: highlightPosition.left - 4,
            width: highlightPosition.width + 8,
            height: highlightPosition.height + 8,
            border: '3px solid #4facfe',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(79, 172, 254, 0.6)',
            animation: 'guided-pulse 2s infinite'
          }}
        />
      )}

      {/* 提示框 */}
      {tooltipPosition && (
        <div
          className="absolute bg-white rounded-lg shadow-2xl p-6 pointer-events-auto max-w-sm"
          style={{
            top: Math.max(10, Math.min(tooltipPosition.top, window.innerHeight - 220)),
            left: Math.max(10, Math.min(tooltipPosition.left, window.innerWidth - 340))
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onSkip}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 步骤指示器 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
              {currentStep + 1}
            </div>
            <div className="text-sm text-gray-500">
              第 {currentStep + 1} 步，共 {steps.length} 步
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* 标题和描述 */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* 操作提示 */}
          {currentStepData.action !== 'observe' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                {currentStepData.action === 'click' && '👆 点击高亮的元素'}
                {currentStepData.action === 'drag' && '🖱️ 拖拽高亮的元素'}
                {currentStepData.action === 'input' && '⌨️ 在高亮区域输入内容'}
                {currentStepData.action === 'connect' && '🔗 连接两个节点'}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              上一步
            </Button>

            <div className="flex gap-2">
              {currentStepData.skipEnabled !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-gray-500"
                >
                  跳过引导
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={handleNext}
                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    完成
                  </>
                ) : (
                  <>
                    下一步
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes guided-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.7), 0 0 20px rgba(79, 172, 254, 0.6);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(79, 172, 254, 0), 0 0 20px rgba(79, 172, 254, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(79, 172, 254, 0), 0 0 20px rgba(79, 172, 254, 0.6);
          }
        }
      `}</style>
    </div>
  );
};