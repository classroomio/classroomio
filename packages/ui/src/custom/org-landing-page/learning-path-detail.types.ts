export type LearningPathLessonOutline = {
  id: string;
  title: string;
  durationMinutes: number;
  /** Gated until claimed; the visitorAccess gate controls whether outlines render lock UI. */
  gated?: boolean;
};

export type LearningPathSeriesCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  siteName?: string;
  lessonOutlines: LearningPathLessonOutline[];
  courseCount: number;
  totalHours: number;
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
  createdAt?: string;
};

export type LearningPathDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  logo?: string | null;
  cost: number;
  currency: string;
  courseCount: number;
  totalHours: number;
  hasCertificate: boolean;
  totalStudents: number;
  series: LearningPathSeriesCourse[];
  instructors: LearningPathInstructorItem[];
  certificate?: LearningPathCertificateInfo | null;
  reviews: LearningPathReviewItem[];
  faq: LearningPathFaqItem[];
  metadata?: {
    discount?: number;
    showDiscount?: boolean;
  };
};
