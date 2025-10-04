/**
 * Route configuration types
 */
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  children?: RouteConfig[];
  requiresAuth?: boolean;
  roles?: string[];
}

/**
 * Route paths enum for type-safe navigation
 */
export enum RoutePath {
  // Public routes
  HOME = '/',
  LOGIN = '/login',
  REGISTER = '/register',
  FORGOT_PASSWORD = '/forgot-password',
  
  // Protected routes
  DASHBOARD = '/dashboard',
  PROFILE = '/profile',
  
  // Resume related routes
  RESUMES = '/resumes',
  RESUME_UPLOAD = '/resumes/upload',
  RESUME_SEARCH = '/resumes/search',
  
  // Job related routes
  JOBS = '/jobs',
  JOB_POST = '/jobs/post',
  JOB_SEARCH = '/jobs/search',
  
  // Match related routes
  MATCHES = '/matches',
  
  // Chat/QA related routes
  CHAT = '/chat'
}