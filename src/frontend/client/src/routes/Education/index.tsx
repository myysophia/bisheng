import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { EducationProvider } from './context/EducationContext';
import { EducationErrorBoundary } from './components/ErrorBoundary';

export default function EducationLayout() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

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

  useEffect(() => {
    const pendingRedirect = localStorage.getItem('pendingEducationRedirect');
    if (isAuthenticated && pendingRedirect) {
      localStorage.removeItem('pendingEducationRedirect');
      navigate('/education', { replace: true });
    }
    
    // 强制检查和设置认证状态
    const wsToken = localStorage.getItem('ws_token');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const demoMode = localStorage.getItem('educationDemoMode');
    
    console.log('🔧 EducationLayout: 认证检查', { 
      isAuthenticated, 
      hasToken: !!(token || wsToken), 
      hasUser: !!user, 
      demoMode 
    });
    
    // 如果有认证数据但认证状态为false，强制设置
    if (isAuthenticated === false && (token || wsToken) && user && demoMode === 'true') {
      console.log('🔧 EducationLayout: 强制设置认证状态');
      setTestToken();
      return;
    }
    
    // 如果未认证，尝试从平台获取token或自动设置测试token
    if (isAuthenticated === false) {
      // 如果有平台token但没有客户端token，自动同步
      if (wsToken && !token) {
        localStorage.setItem('token', wsToken);
        window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: wsToken }));
        // 延迟刷新，让事件处理完成
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } 
      // 如果没有任何token，自动设置测试token（开发环境）
      else if (!wsToken && !token) {
        console.log('🔧 EducationLayout: 未找到认证token，自动设置测试token');
        setTestToken();
      }
    }
  }, [isAuthenticated, navigate]);

  // 如果认证状态还未初始化，显示加载状态
  if (isAuthenticated === undefined) {
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
