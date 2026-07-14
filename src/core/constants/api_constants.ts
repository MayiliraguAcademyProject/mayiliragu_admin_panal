export const ApiConstants = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string) || (import.meta.env.VITE_API_URL as string) || 'http://192.168.31.86:5000/api',
  getAssetUrl: (path: string) => {
    if (!path) return '';
    const base = (import.meta.env.VITE_API_BASE_URL as string) || (import.meta.env.VITE_API_URL as string) || 'http://192.168.31.86:5000/api';
    const serverRoot = base.endsWith('/api') ? base.slice(0, -4) : base;
    return `${serverRoot}${path}`;
  },
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  dashboard: {
    admin: '/dashboard/admin',
  },
  courses: {
    base: '/courses',
    detail: (courseId: string) => `/courses/${courseId}`,
  },
  modules: {
    base: '/modules',
    detail: (moduleId: string) => `/modules/${moduleId}`,
    swap: '/modules/sort/swap',
  },
  lessons: {
    base: '/lessons',
    detail: (lessonId: string) => `/lessons/${lessonId}`,
    swap: '/lessons/sort/swap',
    downloads: '/lessons/admin/downloads',
  },
  students: {
    base: '/enrollments/students',
    list: '/enrollments/students',
    detail: (studentId: string) => `/enrollments/students/${studentId}`,
    enrollments: (studentId: string) => `/enrollments/student/${studentId}`,
    enroll: '/enrollments',
    revoke: (enrollmentId: string) => `/enrollments/${enrollmentId}`,
  },
  questions: {
    base: '/questions',
    detail: (questionId: string) => `/questions/${questionId}`,
    stats: '/questions/stats',
    import: '/questions/import',
    export: '/questions/export',
    template: '/questions/import/template',
  },
  tests: {
    base: '/tests',
    detail: (testId: string) => `/tests/${testId}`,
    categories: '/tests/categories',
    subjects: '/tests/subjects',
    topics: '/tests/topics',
    analytics: '/tests/analytics/stats',
    attemptsAll: '/tests/attempts/all',
  },
  banners: {
    base: '/banners',
    admin: '/banners/admin',
    detail: (id: string) => `/banners/${id}`,
    toggle: (id: string) => `/banners/${id}/toggle`,
  },
  currentAffairs: {
    base: '/current-affairs',
    admin: '/current-affairs/admin',
    detail: (id: string) => `/current-affairs/${id}`,
    quizzes: (articleId: string) => `/current-affairs/${articleId}/quizzes`,
    magazinesAll: '/current-affairs/magazines/all',
    magazinesUpload: '/current-affairs/magazines/upload',
    schemesAll: '/current-affairs/schemes/all',
    schemes: '/current-affairs/schemes',
    datesAll: '/current-affairs/important-dates/all',
    dates: '/current-affairs/important-dates',
  },
  studyMaterials: {
    base: '/study-materials',
    categories: '/study-materials/categories',
    categoryDetail: (id: string) => `/study-materials/categories/${id}`,
    detail: (id: string) => `/study-materials/${id}`,
  },
  analytics: {
    facultyClass: '/analytics/faculty/class',
    adminBatches: '/analytics/admin/batches',
  },
  books: {
    base: '/books',
    detail: (id: string) => `/books/${id}`,
    orders: '/books/orders',
    orderStatus: (id: string) => `/books/admin/orders/${id}/status`,
    orderPayment: (id: string) => `/books/admin/orders/${id}/payment`,
    adminOrders: '/books/admin/orders',
    adminCoupons: '/books/admin/coupons',
    adminBooks: '/books/admin/books',
    adminBookDetail: (id: string) => `/books/admin/books/${id}`,
    paymentQr: '/books/payment-qr',
    adminPaymentQr: '/books/admin/payment-qr',
  },
  notifications: {
    sendImmediate: '/notifications/admin/send',
    campaigns: '/notifications/admin/campaigns',
  },
  progress: {
    lessonStats: (lessonId: string) => `/progress/lesson/${lessonId}/stats`,
  },
  appConfig: {
    base: '/app-config',
  },
} as const;
