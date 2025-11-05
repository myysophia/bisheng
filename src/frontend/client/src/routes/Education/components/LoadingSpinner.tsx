import React from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { cn } from '~/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  fullScreen = false,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gradient-to-b from-[#F4F8FF] to-white flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center">
        <div className="relative mb-4">
          <div className={cn(
            "animate-spin rounded-full border-b-2 border-blue-main mx-auto",
            sizeClasses[size]
          )}></div>
          
          {/* 教育图标 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className={cn(
              "text-blue-main/30",
              size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
            )} />
          </div>
        </div>
        
        {message && (
          <p className={cn(
            "text-text-secondary",
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
          )}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// 骨架屏组件
export function CourseSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-border-light overflow-hidden">
            {/* 缩略图骨架 */}
            <div className="h-48 bg-surface-secondary"></div>
            
            {/* 内容骨架 */}
            <div className="p-6">
              <div className="h-4 bg-surface-secondary rounded mb-2"></div>
              <div className="h-4 bg-surface-secondary rounded w-3/4 mb-4"></div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-surface-secondary rounded-full"></div>
                <div className="h-3 bg-surface-secondary rounded w-24"></div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="h-3 bg-surface-secondary rounded w-16"></div>
                <div className="h-3 bg-surface-secondary rounded w-16"></div>
                <div className="h-3 bg-surface-secondary rounded w-16"></div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-surface-secondary rounded-full w-16"></div>
                <div className="h-6 bg-surface-secondary rounded-full w-20"></div>
              </div>
              
              <div className="h-10 bg-surface-secondary rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 章节列表骨架屏
export function ChapterSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-border-light p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-surface-secondary rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-surface-secondary rounded mb-2"></div>
                <div className="h-4 bg-surface-secondary rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-surface-secondary rounded w-24"></div>
              </div>
            </div>
            <div className="h-10 bg-surface-secondary rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 进度页面骨架屏
export function ProgressSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-border-light p-6 text-center">
            <div className="w-12 h-12 bg-surface-secondary rounded-lg mx-auto mb-3"></div>
            <div className="h-8 bg-surface-secondary rounded mb-1"></div>
            <div className="h-4 bg-surface-secondary rounded w-20 mx-auto"></div>
          </div>
        ))}
      </div>
      
      {/* 整体进度骨架 */}
      <div className="bg-white rounded-lg shadow-sm border border-border-light p-6 mb-8">
        <div className="h-6 bg-surface-secondary rounded w-48 mb-4"></div>
        <div className="h-4 bg-surface-secondary rounded mb-4"></div>
        <div className="h-4 bg-surface-secondary rounded w-64"></div>
      </div>
      
      {/* 课程进度骨架 */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-border-light p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-secondary rounded-lg"></div>
                <div>
                  <div className="h-5 bg-surface-secondary rounded w-32 mb-2"></div>
                  <div className="h-4 bg-surface-secondary rounded w-24"></div>
                </div>
              </div>
              <div className="h-10 bg-surface-secondary rounded w-24"></div>
            </div>
            <div className="h-2 bg-surface-secondary rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 页面级加载组件
export function PageLoading({ message = "正在加载..." }: { message?: string }) {
  return (
    <LoadingSpinner 
      size="lg" 
      message={message} 
      fullScreen 
    />
  );
}

export default LoadingSpinner;