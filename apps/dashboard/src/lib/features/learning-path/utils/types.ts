import type {
  TLearningPathStatus,
  TLearningPathDifficulty,
  TLearningPathVisitorAccess,
  TCreateLearningPath,
  TUpdateLearningPath
} from '@cio/utils/validation/learning-path/learning-path';

export type { TCreateLearningPath, TUpdateLearningPath };

export type LearningPathStatus = TLearningPathStatus;
export type LearningPathDifficulty = TLearningPathDifficulty;
export type LearningPathVisitorAccess = TLearningPathVisitorAccess;

export interface LearningPathCourseItem {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description?: string | null;
  lessonsCount: number;
  exercisesCount: number;
  cost: number;
  currency: string;
  thumbnailGradient?: string;
  coverImage?: string | null;
  outcomes?: string[];
}

export interface LearningPathSummary {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: LearningPathStatus;
  difficulty?: LearningPathDifficulty | null;
  estimatedDurationMinutes?: number | null;
  cost: number;
  currency: string;
  showSavings: boolean;
  courseCount: number;
  memberCount: number;
  completionsCount: number;
  completionRate: number;
  courseOrderSetAt?: string | null;
  updatedAt: string;
  createdAt: string;
  gradient?: string;
}

export interface LearningPathLandingPageData {
  headline?: string;
  subheadline?: string;
  visitorAccess?: LearningPathVisitorAccess;
  outcomes?: string[];
  skills?: string[];
  showInstructors?: boolean;
  showTestimonials?: boolean;
  testimonials?: Array<{
    id: string;
    name: string;
    role?: string;
    avatarUrl?: string;
    quote: string;
  }>;
  showFaqs?: boolean;
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  showRating?: boolean;
  rating?: { average: number; count: number };
}

export interface LearningPathDetail extends LearningPathSummary {
  sequentialUnlock: boolean;
  selfEnrollment: boolean;
  autoEnroll: boolean;
  certificateEnabled: boolean;
  certificateTitle?: string | null;
  certificateIssuer?: string | null;
  certificateDesign?: Record<string, unknown>;
  landingPage?: LearningPathLandingPageData;
  courses: LearningPathCourseItem[];
}

export interface LearningPathMetrics {
  activePaths: number;
  enrolledLearners: number;
  completions: number;
  completionRate: number;
}

export type StatusFilter = 'all' | 'draft' | 'published' | 'archived';
export type EnrollmentFilter = 'all' | 'none' | '1-49' | '50+';
export type CompletionFilter = 'all' | 'low' | 'medium' | 'high';
export type ViewMode = 'grid' | 'list';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  actionText: string;
  href: string;
  isCompleted: boolean;
  isCurrent: boolean;
}
