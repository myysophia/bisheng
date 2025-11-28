import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { EducationProvider } from './context/EducationContext';
import { EducationErrorBoundary } from './components/ErrorBoundary';

export default function EducationLayout() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  // 添加初始化状态，用于防止闪烁
  const [isInitializing, setIsInitializing] = useState(true);
  const initRef = useRef(false);

  // 尝试从平台前端获取token
  const tryGetPlatformToken = () => {
    // 检查是否有平台前端的token
    const wsToken = localStorage.getItem('ws_token');
    if (wsToken) {
      // 同步token到客户端
      localStorage.setItem('token', wsToken);
      
      // 触发token更新事件
      window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: wsToken }));
      
      // 刷新页面以重新认证
      window.location.reload();
      return;
    }
    
    // 如果没有token，跳转到平台登录
    window.location.href = 'http://localhost:3001/';
  };

  // 设置测试token的函数（仅用于开发测试）
  const setTestToken = () => {
    const testToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ7XCJ1c2VyX25hbWVcIjogXCJ0ZXN0QDEyMy5jb21cIiwgXCJ1c2VyX2lkXCI6IDEsIFwicm9sZVwiOiBcImFkbWluXCJ9IiwiaWF0IjoxNzYyMTU2OTY5LCJuYmYiOjE3NjIxNTY5NjksImp0aSI6ImIxZWQ2YmU1LTA2MWYtNDM4YS1iYTYyLWVkZGJhZGRjZjA3ZiIsImV4cCI6MTc2MjI0MzM2OSwidHlwZSI6ImFjY2VzcyIsImZyZXNoIjpmYWxzZX0.uhK_bJ6lQHym38xkP7n_l2H1rxGsTPPUM6ErjMzHbP8';

    // 设置token到localStorage（同时设置两个key）
    localStorage.setItem('token', testToken);
    localStorage.setItem('ws_token', testToken);
    
    // 设置用户信息
    const testUser = {
      user_name: 'test@123.com',
      user_id: 1,
      role: 'admin'
    };
    localStorage.setItem('user', JSON.stringify(testUser));

    // 记录需要回到教学中心
    localStorage.setItem('pendingEducationRedirect', 'true');
    localStorage.setItem('educationDemoMode', 'true');

    // 触发token更新事件
    window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: testToken }));

    // 路由跳转至教学中心，避免整页刷新
    navigate('/education', { replace: true });
  };

  // 初始化检查 - 只在组件首次挂载时执行一次
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // 检查 URL 参数中是否有认证信息（跨域传递场景）
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('auth_token');
    
    // 检查本地存储中是否有认证信息
    const wsToken = localStorage.getItem('ws_token');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔧 EducationLayout: 初始化检查', { 
      isAuthenticated, 
      hasToken: !!(token || wsToken),
      hasUrlToken: !!urlToken,
      hasUser: !!user
    });

    // 如果 URL 中有认证信息，等待 AuthContext 处理完成
    if (urlToken) {
      console.log('🔧 EducationLayout: 检测到URL认证参数，等待AuthContext处理');
      // 给 AuthContext 足够时间处理 URL 参数
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 200);
      return () => clearTimeout(timer);
    }

    // 如果本地有完整的认证信息，等待 AuthContext 完成初始化
    if ((token || wsToken) && user) {
      // 给 AuthContext 一点时间来恢复状态
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    
    // 如果没有认证信息，直接结束初始化
    setIsInitializing(false);
  }, []);

  // 处理认证状态变化
  useEffect(() => {
    // 如果还在初始化中，不执行任何操作
    if (isInitializing) return;

    const pendingRedirect = localStorage.getItem('pendingEducationRedirect');
    if (isAuthenticated && pendingRedirect) {
      localStorage.removeItem('pendingEducationRedirect');
      navigate('/education', { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  // 当认证状态确定后，更新初始化状态
  useEffect(() => {
    if (isAuthenticated) {
      setIsInitializing(false);
    }
  }, [isAuthenticated]);

  // 如果正在初始化，显示加载状态（防止闪烁）
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#F4F8FF] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载教学系统...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示提示信息和测试按钮
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#F4F8FF] to-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">智能体教学系统</h2>
          <p className="text-gray-600 mb-6">请先登录以访问教学功能</p>
          <div className="space-y-3">
            <button
              onClick={tryGetPlatformToken}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              从管理界面获取登录状态
            </button>
            <button
              onClick={() => window.location.href = 'http://localhost:3001/'}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              前往管理界面登录
            </button>
            <button
              onClick={setTestToken}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              使用测试Token（开发用）
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EducationErrorBoundary>
      <EducationProvider>
        <div className="education-layout h-full bg-gradient-to-b from-[#F4F8FF] to-white">
          <Outlet />
        </div>
      </EducationProvider>
    </EducationErrorBoundary>
  );
}
