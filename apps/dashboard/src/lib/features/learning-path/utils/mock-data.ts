import type { LearningPathDetail, LearningPathCourseItem } from './types';

export const MOCK_BOOTCAMP_COURSES: LearningPathCourseItem[] = [
  {
    id: 'lpc-1',
    courseId: 'c-html-css',
    order: 1,
    title: 'HTML & CSS Foundations',
    description: 'Structure, semantic layout, responsive modern design and CSS Grid.',
    lessonsCount: 12,
    exercisesCount: 2,
    cost: 49,
    currency: 'USD',
    thumbnailGradient: 'linear-gradient(135deg, oklch(0.705 0.213 47.604), oklch(0.75 0.183 55.934))'
  },
  {
    id: 'lpc-2',
    courseId: 'c-js-essentials',
    order: 2,
    title: 'JavaScript Essentials',
    description: 'Modern ES6+ syntax, asynchronous programming, DOM manipulation.',
    lessonsCount: 10,
    exercisesCount: 3,
    cost: 59,
    currency: 'USD',
    thumbnailGradient: 'linear-gradient(135deg, oklch(0.795 0.184 86.047), oklch(0.769 0.188 70.08))'
  },
  {
    id: 'lpc-3',
    courseId: 'c-react',
    order: 3,
    title: 'Modern Web Development with React',
    description: 'Components, hooks, virtual DOM, and building dynamic single-page applications.',
    lessonsCount: 12,
    exercisesCount: 4,
    cost: 79,
    currency: 'USD',
    thumbnailGradient: 'linear-gradient(135deg, oklch(0.685 0.169 237.323), oklch(0.488 0.243 264.376))'
  },
  {
    id: 'lpc-4',
    courseId: 'c-state-mgmt',
    order: 4,
    title: 'State Management & Data Fetching',
    description: 'Context, modern query clients, REST APIs, and cache synchronization.',
    lessonsCount: 10,
    exercisesCount: 3,
    cost: 59,
    currency: 'USD',
    thumbnailGradient: 'linear-gradient(135deg, oklch(0.585 0.233 277.117), oklch(0.606 0.25 292.717))'
  },
  {
    id: 'lpc-5',
    courseId: 'c-capstone',
    order: 5,
    title: 'Building & Shipping a Capstone',
    description: 'Full-stack application integration, testing, deployment, and performance audit.',
    lessonsCount: 7,
    exercisesCount: 1,
    cost: 34,
    currency: 'USD',
    thumbnailGradient: 'linear-gradient(135deg, oklch(0.645 0.246 16.439), oklch(0.586 0.253 17.585))'
  }
];

export const MOCK_PATHS: LearningPathDetail[] = [
  {
    id: 'lp-frontend-bootcamp',
    organizationId: 'org-1',
    name: 'Frontend Engineering Bootcamp',
    slug: 'frontend-engineering-bootcamp',
    description: 'HTML foundations through shipping a production React app.',
    coverImage: null,
    status: 'ACTIVE',
    difficulty: 'INTERMEDIATE',
    estimatedDurationMinutes: 2400,
    cost: 199,
    currency: 'USD',
    showSavings: true,
    sequentialUnlock: true,
    selfEnrollment: true,
    autoEnroll: true,
    certificateEnabled: true,
    certificateTitle: 'Professional Certificate in Frontend Engineering',
    certificateIssuer: 'Acme Academy',
    courseOrderSetAt: '2026-09-01T10:00:00Z',
    courseCount: 5,
    memberCount: 48,
    completionsCount: 20,
    completionRate: 42,
    gradient: 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    landingPage: {
      headline: 'Become a job-ready frontend developer',
      subheadline: 'Learn industry standards with hands-on projects, exercises, and real deployment.',
      visitorAccess: 'syllabus'
    },
    courses: [...MOCK_BOOTCAMP_COURSES],
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lp-data-science',
    organizationId: 'org-1',
    name: 'Data Science with Python',
    slug: 'data-science-with-python',
    description: 'Pandas, visualization, and applied ML basics.',
    coverImage: null,
    status: 'ACTIVE',
    difficulty: 'BEGINNER',
    estimatedDurationMinutes: 1800,
    cost: 149,
    currency: 'USD',
    showSavings: true,
    sequentialUnlock: true,
    selfEnrollment: true,
    autoEnroll: true,
    certificateEnabled: true,
    certificateTitle: 'Certificate in Applied Data Science',
    certificateIssuer: 'Acme Academy',
    courseOrderSetAt: '2026-08-15T10:00:00Z',
    courseCount: 4,
    memberCount: 61,
    completionsCount: 17,
    completionRate: 28,
    gradient: 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
    landingPage: {
      headline: 'Master Python for Data Analysis and ML',
      subheadline: 'From data wrangling to predictive models with scikit-learn.'
    },
    courses: MOCK_BOOTCAMP_COURSES.slice(0, 4),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lp-product-management',
    organizationId: 'org-1',
    name: 'Product Management Fundamentals',
    slug: 'product-management-fundamentals',
    description: 'Discovery, prioritization, and roadmap craft.',
    coverImage: null,
    status: 'DRAFT',
    difficulty: 'BEGINNER',
    estimatedDurationMinutes: 1500,
    cost: 99,
    currency: 'USD',
    showSavings: true,
    sequentialUnlock: true,
    selfEnrollment: true,
    autoEnroll: true,
    certificateEnabled: true,
    certificateTitle: 'Product Management Certificate',
    certificateIssuer: 'Acme Academy',
    courseOrderSetAt: null,
    courseCount: 5,
    memberCount: 0,
    completionsCount: 0,
    completionRate: 0,
    gradient: 'linear-gradient(135deg, oklch(0.666 0.179 58.318), oklch(0.769 0.188 70.08))',
    landingPage: {
      headline: 'Build products users love'
    },
    courses: [...MOCK_BOOTCAMP_COURSES],
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'lp-workplace-compliance',
    organizationId: 'org-1',
    name: 'Workplace Compliance 2026',
    slug: 'workplace-compliance-2026',
    description: 'Security awareness, data handling, code of conduct.',
    coverImage: null,
    status: 'ARCHIVED',
    difficulty: 'BEGINNER',
    estimatedDurationMinutes: 300,
    cost: 0,
    currency: 'USD',
    showSavings: false,
    sequentialUnlock: false,
    selfEnrollment: false,
    autoEnroll: true,
    certificateEnabled: true,
    certificateTitle: 'Annual Compliance Certificate',
    certificateIssuer: 'Acme Academy',
    courseOrderSetAt: '2026-01-10T10:00:00Z',
    courseCount: 3,
    memberCount: 17,
    completionsCount: 14,
    completionRate: 81,
    gradient: 'linear-gradient(135deg, oklch(0.45 0.05 260), oklch(0.55 0.05 260))',
    landingPage: {
      headline: 'Annual Mandatory Workplace Compliance'
    },
    courses: MOCK_BOOTCAMP_COURSES.slice(0, 3),
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const MOCK_AVAILABLE_ORG_COURSES = [
  {
    id: 'c-typescript',
    title: 'TypeScript for Large-Scale Apps',
    description: 'Static typing, generics, utility types, and compiler configuration.',
    lessonsCount: 8,
    exercisesCount: 2,
    cost: 49
  },
  {
    id: 'c-nextjs',
    title: 'Fullstack React with Next.js',
    description: 'App router, server actions, caching strategies, and SSR streaming.',
    lessonsCount: 14,
    exercisesCount: 5,
    cost: 89
  },
  {
    id: 'c-graphql',
    title: 'API Design with GraphQL',
    description: 'Schemas, resolvers, queries, mutations, and client cache optimization.',
    lessonsCount: 9,
    exercisesCount: 3,
    cost: 59
  },
  {
    id: 'c-docker',
    title: 'Docker & Containers for Developers',
    description: 'Containerizing Node.js apps, multi-stage builds, and Docker Compose.',
    lessonsCount: 6,
    exercisesCount: 2,
    cost: 39
  }
];
