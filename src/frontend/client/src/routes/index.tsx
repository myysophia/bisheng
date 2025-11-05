import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import {
  Login,
  Registration,
  RequestPasswordReset,
  ResetPassword,
  VerifyEmail,
  ApiErrorWatcher,
  TwoFactorScreen,
} from '~/components/Auth';
import { AuthContextProvider } from '~/hooks/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';
import Sop from '~/components/Sop';
import WebView from '~/components/WebView';
import EducationLayout from './Education';
import EducationCenter from './Education/pages/EducationCenter';
import CourseDetail from './Education/pages/CourseDetail';
import ChapterLearning from './Education/pages/ChapterLearning';
import ProgressPage from './Education/pages/ProgressPage';
import PracticeEnvironment from './Education/pages/PracticeEnvironment';
import GuidedBuilder from './Education/pages/GuidedBuilder';
import CreationSuccess from './Education/pages/CreationSuccess';
import TestPage from './Education/pages/TestPage';

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
    <ApiErrorWatcher />
  </AuthContextProvider>
);

const baseConfig = {
  //@ts-ignore
  basename: __APP_ENV__.BASE_URL
}

export const router = createBrowserRouter([
  {
    path: 'share/:shareId',
    element: <ShareRoute />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <StartupLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'register',
        element: <Registration />,
      },
      {
        path: 'forgot-password',
        element: <RequestPasswordReset />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: 'verify',
    element: <VerifyEmail />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/' + __APP_ENV__.BISHENG_HOST,
        element: <LoginLayout />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'login/2fa',
            element: <TwoFactorScreen />,
          },
        ],
      },
      // 提示词管理
      // dashboardRoutes,
      {
        path: '/',
        element: <Root />,
        children: [
          {
            index: true,
            element: <Navigate to="/c/new" replace={true} />,
          },
          {
            path: 'c/:conversationId?',
            element: <ChatRoute />,
          },
          {
            path: 'linsight/:conversationId?',
            element: <Sop />,
          },
          // {
          //   path: 'search',
          //   element: <Search />,
          // },
        ],
      },
      // 教育模块路由
      {
        path: '/education',
        element: <EducationLayout />,
        children: [
          {
            index: true,
            element: <EducationCenter />,
          },
          {
            path: 'courses/:courseId',
            element: <CourseDetail />,
          },
          {
            path: 'courses/:courseId/chapters/:chapterId',
            element: <ChapterLearning />,
          },
          {
            path: 'progress',
            element: <ProgressPage />,
          },
          {
            path: 'practice',
            element: <PracticeEnvironment />,
          },
          {
            path: 'guided-builder',
            element: <GuidedBuilder />,
          },
          {
            path: 'success',
            element: <CreationSuccess />,
          },
          {
            path: 'test',
            element: <TestPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/html',
    element: <WebView />,
  },
], baseConfig);
