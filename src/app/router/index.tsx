import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../../shared/components/ProtectedRoute';
import { PublicRoute } from '../../shared/components/PublicRoute';
import MainLayoutShell from '../layouts/MainLayoutShell';

// Lazy load pages for performance as requested in performance rules
const LoginPage = React.lazy(() => import('../../modules/auth/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('../../modules/dashboard/pages/DashboardPage'));
const CourseListPage = React.lazy(() => import('../../modules/courses/pages/CourseListPage'));
const CourseDetailPage = React.lazy(() => import('../../modules/courses/pages/CourseDetailPage'));
const StudentManagementPage = React.lazy(() => import('../../modules/students/pages/StudentManagementPage'));
const TestsPage = React.lazy(() => import('../../modules/tests/pages/TestsPage'));
const CategoryDetailPage = React.lazy(() => import('../../modules/tests/pages/CategoryDetailPage'));
const BannerListPage = React.lazy(() => import('../../modules/banners/pages/BannerListPage'));
const CurrentAffairsPage = React.lazy(() => import('../../modules/current-affairs/pages/CurrentAffairsPage'));
const StudyMaterialsPage = React.lazy(() => import('../../modules/study-materials/pages/StudyMaterialsPage'));
const PerformanceAnalyticsPage = React.lazy(() => import('../../modules/performance/pages/PerformanceAnalyticsPage'));
const BookStorePage = React.lazy(() => import('../../modules/book-store/pages/BookStorePage'));
const VideoDownloadsPage = React.lazy(() => import('../../modules/downloads/pages/VideoDownloadsPage'));

// Loading fallback component
const SuspenseFallback = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[300px]">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <React.Suspense fallback={<SuspenseFallback />}>
          <LoginPage />
        </React.Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayoutShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <DashboardPage />
          </React.Suspense>
        ),
      },
      {
        path: 'courses',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <CourseListPage />
          </React.Suspense>
        ),
      },
      {
        path: 'courses/:id',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <CourseDetailPage />
          </React.Suspense>
        ),
      },
      {
        path: 'student-management',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <StudentManagementPage />
          </React.Suspense>
        ),
      },
      {
        path: 'tests',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <TestsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'banners',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <BannerListPage />
          </React.Suspense>
        ),
      },
      {
        path: 'current-affairs',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <CurrentAffairsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'study-materials',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <StudyMaterialsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'performance-analytics',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <PerformanceAnalyticsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'book-store',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <BookStorePage />
          </React.Suspense>
        ),
      },
      {
        path: 'video-downloads',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <VideoDownloadsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'tests/category/:categoryId',
        element: (
          <React.Suspense fallback={<SuspenseFallback />}>
            <CategoryDetailPage />
          </React.Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
