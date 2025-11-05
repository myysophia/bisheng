import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import './locales/i18n';
import App from './App';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';

// 立即设置测试token（开发环境）
if (import.meta.env.DEV) {
  const testToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ7XCJ1c2VyX25hbWVcIjogXCJ0ZXN0QDEyMy5jb21cIiwgXCJ1c2VyX2lkXCI6IDEsIFwicm9sZVwiOiBcImFkbWluXCJ9IiwiaWF0IjoxNzYyMTU2OTY5LCJuYmYiOjE3NjIxNTY5NjksImp0aSI6ImIxZWQ2YmU1LTA2MWYtNDM4YS1iYTYyLWVkZGJhZGRjZjA3ZiIsImV4cCI6MTc2MjI0MzM2OSwidHlwZSI6ImFjY2VzcyIsImZyZXNoIjpmYWxzZX0.uhK_bJ6lQHym38xkP7n_l2H1rxGsTPPUM6ErjMzHbP8';
  
  console.log('🔧 主入口：立即设置测试token');
  localStorage.setItem('token', testToken);
  localStorage.setItem('ws_token', testToken);
  localStorage.setItem('educationDemoMode', 'true');
  
  // 设置用户信息
  const testUser = {
    user_name: 'test@123.com',
    user_id: 1,
    role: 'admin'
  };
  localStorage.setItem('user', JSON.stringify(testUser));
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ApiErrorBoundaryProvider>
    <App />
  </ApiErrorBoundaryProvider>,
);
