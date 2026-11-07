export interface PluginIdentityProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  role: 'admin' | 'tutor' | 'student';
}

export interface PluginOrganizationProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  locale: string;
}

export interface PluginCursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PluginCourseMetadata {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  type: string | null;
  status: string;
  visibility: 'public' | 'private';
  published: boolean;
  publishedAt: string | null;
  sessionTimezone: string | null;
  certificateDeadline: string | null;
  instructor: {
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PluginCourseSectionLesson {
  id: string;
  title: string;
  order: number;
  type: string;
}

export interface PluginCourseSection {
  id: string;
  title: string;
  order: number;
  lessons: PluginCourseSectionLesson[];
}

export interface PluginCourseStructure {
  courseId: string;
  sections: PluginCourseSection[];
}

export interface PluginLessonMetadata {
  id: string;
  courseId: string;
  title: string;
  type: string;
  order: number;
  published: boolean;
  wordCount: number;
  estimatedMinutes: number;
  lessonAt: string | null;
  callUrl: string | null;
  recordingUrl: string | null;
  sessionDurationMinutes: number | null;
  instructor: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PluginLessonAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface PluginLessonContent {
  id: string;
  courseId: string;
  title: string;
  type: string;
  order: number;
  content: string | null;
  attachments: PluginLessonAttachment[];
  wordCount: number;
  estimatedMinutes: number;
  updatedAt: string;
}

export interface PluginExerciseMetadata {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  order: number;
  allowMultipleAttempts: boolean;
  completionPolicy: string;
  passThreshold: number | null;
  questionCount: number;
  totalPoints: number;
  dueBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PluginLessonProgress {
  isComplete: boolean;
}

export interface PluginCourseProgress {
  courseId: string;
  percentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  isComplete: boolean;
  certificateEarnedAt: string | null;
}

export interface PluginIssuedCertificate {
  id: string;
  courseId: string;
  profileId: string;
  cycleNumber: number;
  issuedAt: string;
  expiresAt: string;
  status: string;
  verificationUrl: string | null;
}

export interface PluginCertificateTemplate {
  id: string;
  name: string;
  style: string;
  description: string;
  accentColor: string;
  subtitle: string;
  version: number;
  design: Record<string, unknown>;
}

export interface PluginAppliedCertificateTemplate {
  courseId: string;
  isDownloadable: boolean;
  design: Record<string, unknown> | null;
  sourceTemplate: {
    pluginId: string;
    externalTemplateId: string;
    version: number;
    name: string;
    appliedAt: string;
  } | null;
}
