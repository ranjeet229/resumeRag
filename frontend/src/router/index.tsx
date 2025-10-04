import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './guards';
import { RoutePath } from './types';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Layouts
const MainLayout = lazy(() => import('../layouts/MainLayout'));
const AuthLayout = lazy(() => import('../layouts/AuthLayout'));

// Public Pages
const Login = lazy(() => import('../views/auth/Login'));
const Register = lazy(() => import('../views/auth/Register'));
const ForgotPassword = lazy(() => import('../views/auth/ForgotPassword'));

// Protected Pages
const Dashboard = lazy(() => import('../views/Dashboard'));
const Profile = lazy(() => import('../views/Profile'));
const ResumeUpload = lazy(() => import('../views/resumes/ResumeUpload'));
const ResumeSearch = lazy(() => import('../views/resumes/ResumeSearch'));
const JobPost = lazy(() => import('../views/jobs/JobPost'));
const JobSearch = lazy(() => import('../views/jobs/JobSearch'));
const Matches = lazy(() => import('../views/matches/Matches'));
const Chat = lazy(() => import('../views/chat/Chat'));

// Error Pages
const NotFound = lazy(() => import('../views/errors/NotFound'));

/**
 * Wrapper for lazy-loaded components with loading state
 */
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

/**
 * Router configuration with nested routes and authentication guards
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(MainLayout),
    children: [
      // Protected routes
      {
        path: RoutePath.DASHBOARD,
        element: (
          <ProtectedRoute>
            {withSuspense(Dashboard)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.PROFILE,
        element: (
          <ProtectedRoute>
            {withSuspense(Profile)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.RESUME_UPLOAD,
        element: (
          <ProtectedRoute roles={['recruiter', 'admin']}>
            {withSuspense(ResumeUpload)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.RESUME_SEARCH,
        element: (
          <ProtectedRoute>
            {withSuspense(ResumeSearch)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.JOB_POST,
        element: (
          <ProtectedRoute roles={['recruiter', 'admin']}>
            {withSuspense(JobPost)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.JOB_SEARCH,
        element: (
          <ProtectedRoute>
            {withSuspense(JobSearch)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.MATCHES,
        element: (
          <ProtectedRoute>
            {withSuspense(Matches)}
          </ProtectedRoute>
        ),
      },
      {
        path: RoutePath.CHAT,
        element: (
          <ProtectedRoute>
            {withSuspense(Chat)}
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Auth routes with separate layout
  {
    element: withSuspense(AuthLayout),
    children: [
      {
        path: RoutePath.LOGIN,
        element: (
          <PublicRoute>
            {withSuspense(Login)}
          </PublicRoute>
        ),
      },
      {
        path: RoutePath.REGISTER,
        element: (
          <PublicRoute>
            {withSuspense(Register)}
          </PublicRoute>
        ),
      },
      {
        path: RoutePath.FORGOT_PASSWORD,
        element: (
          <PublicRoute>
            {withSuspense(ForgotPassword)}
          </PublicRoute>
        ),
      },
    ],
  },
  // 404 page
  {
    path: '*',
    element: withSuspense(NotFound),
  },
]);