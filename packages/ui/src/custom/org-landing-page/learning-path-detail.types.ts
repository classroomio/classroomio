export type LearningPathLessonOutline = {
  id: string;
  title: string;
  /** Gated until claimed; the visitorAccess gate controls whether outlines render lock UI. */
  gated?: boolean;
  preview?: boolean;
};

export type LearningPathSeriesCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  siteName?: string;
  outcomes?: string[];
  lessonOutlines: LearningPathLessonOutline[];
  courseCount: number;
  lessonCount?: number;
  exerciseCount?: number;
  logo?: string | null;
  cost?: number;
  currency?: string;
};

export type LearningPathInstructorItem = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string;
  coursesCount?: number;
};

export type LearningPathCertificateInfo = {
  issuer?: string;
  validity?: string;
  description?: string;
};

export type LearningPathFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type LearningPathReviewItem = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  rating: number;
  description?: string;
  location?: string;
  createdAt?: string;
};

export type LearningPathPricingInfo = {
  cost: number;
  currency: string;
  originalCost?: number;
  discount?: number;
  showDiscount?: boolean;
  features?: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export type LearningPathDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  chip?: string;
  logo?: string | null;
  cost: number;
  currency: string;
  courseCount: number;
  hasCertificate: boolean;
  totalStudents: number;
  rating?: number;
  reviewsCount?: number;
  level?: string;
  outcomes?: string[];
  skills?: string[];
  series: LearningPathSeriesCourse[];
  instructors: LearningPathInstructorItem[];
  certificate?: LearningPathCertificateInfo | null;
  reviews: LearningPathReviewItem[];
  faq: LearningPathFaqItem[];
  pricing?: LearningPathPricingInfo;
  metadata?: {
    discount?: number;
    showDiscount?: boolean;
  };
};
