import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class EducationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Education Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/education';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-[#F4F8FF] to-white flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-text-primary mb-4">
              教学系统遇到问题
            </h2>
            
            <p className="text-text-secondary mb-6">
              抱歉，教学系统遇到了一个意外错误。请尝试刷新页面或返回首页。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <h4 className="font-medium text-red-800 mb-2">错误详情：</h4>
                <pre className="text-xs text-red-600 overflow-auto">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="submit"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误显示组件
export function ErrorMessage({ 
  message, 
  onRetry, 
  showRetry = true 
}: { 
  message: string; 
  onRetry?: () => void; 
  showRetry?: boolean; 
}) {
  return (
    <Card className="p-6 text-center">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        加载失败
      </h3>
      
      <p className="text-text-secondary mb-4">
        {message}
      </p>
      
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      )}
    </Card>
  );
}

export default EducationErrorBoundary;