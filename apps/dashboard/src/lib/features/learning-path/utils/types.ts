export interface LearningPathCourseItem {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  lessonsCount: number;
  exercisesCount: number;
  cost: number;
  currency: string;
  coverImage?: string | null;
  outcomes?: string[];
}

export interface LearningPathSummary {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  isPublished: boolean;
  difficulty?: unknown;
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
  tutorIds?: string[];
}

export interface LearningPathLandingPageData {
  headline?: string;
  subheadline?: string;
  visitorAccess?: unknown;
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

export type StatusFilter = 'all' | 'published' | 'unpublished';
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

export interface CreateLearningPathInput {
  name: string;
  slug: string;
  description: string;
  organizationId?: string;
}

export type UpdateLearningPathInput = Partial<Omit<LearningPathDetail, 'id' | 'createdAt'>>;
