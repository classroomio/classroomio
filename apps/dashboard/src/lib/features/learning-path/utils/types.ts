export type LearningPathStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type LearningPathCourseState = 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type VisitorAccess = 'teaser' | 'syllabus' | 'preview';

export type PathDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type PathDurationBucket = 'Under 4h' | '4-10h' | '10h+';

export interface LearningPathInstructor {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
}

export interface LearningPathTestimonial {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  quote: string;
}

export interface LearningPathFaq {
  id: string;
  question: string;
  answer: string;
}

export interface LearningPathLanding {
  headline: string;
  subheadline: string;
  visitorAccess: VisitorAccess;
  outcomes: string[];
  skills: string[];
  showInstructors: boolean;
  testimonials: LearningPathTestimonial[];
  showTestimonials: boolean;
  faqs: LearningPathFaq[];
  showFaqs: boolean;
}

export interface LearningPathLessonOutlineItem {
  id: string;
  title: string;
  durationMinutes: number;
  isPreview: boolean;
}

export interface LearningPathExerciseOutlineItem {
  id: string;
  title: string;
  isPreview: boolean;
}

export interface LearningPathCourse {
  id: string;
  title: string;
  description: string;
  order: number;
  slug?: string;
  coverImage?: string;
  coverGradient?: string;
  courseType?: string;
  lessonCount: number;
  exerciseCount: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  lessons?: LearningPathLessonOutlineItem[];
  exercises?: LearningPathExerciseOutlineItem[];
  outcomeBullets: string[];
  durationHours: number;
  cost: number;
}

export interface LearningPathMember {
  id: string;
  pathId: string;
  profileId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'TUTOR' | 'STUDENT';
  enrolledAt: string;
  completedAt?: string | null;
  certificateIssuedAt?: string | null;
  certificateId?: string | null;
}

export interface LearningPath {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage?: string;
  coverGradient?: string;
  status: LearningPathStatus;
  cost: number;
  currency: string;
  showSavings: boolean;
  sequentialUnlock: boolean;
  selfEnrollment: boolean;
  autoEnroll: boolean;
  certificateEnabled: boolean;
  certificateTitle: string;
  certificateIssuer: string;
  difficulty: PathDifficulty;
  createdByProfileId: string;
  createdAt: string;
  updatedAt: string;
  landing: LearningPathLanding;
  instructors: LearningPathInstructor[];
  courses: LearningPathCourse[];
  members: LearningPathMember[];
}

export type LearningPathCourseProgress = {
  courseId: string;
  courseIndex: number;
  order: number;
  title: string;
  state: LearningPathCourseState;
  progressPercent: number;
  lessonCount: number;
  exerciseCount: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  durationHours: number;
  slug?: string;
  coverGradient?: string;
  coverImage?: string;
  courseType?: string;
};

export type LearningPathEnrollment = {
  pathId: string;
  memberId: string;
  enrolledAt: string;
  completedAt?: string | null;
  certificateIssuedAt?: string | null;
  certificateId?: string | null;
  progressPercent: number;
  coursesCompleted: number;
  totalCourses: number;
  currentCourse: LearningPathCourseProgress | null;
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
};

export interface LearningPathWithEnrollment extends LearningPath {
  enrollment?: LearningPathEnrollment | null;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

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
  publicId: string;
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
