import { useAuth } from '@/feature/auth/components/auth-provider';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

/** The signed-in user and active org every teach query key is scoped to. */
export function useTeachScope() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return { userId, orgId, enabled: Boolean(userId && orgId) };
}

export const teachKeys = {
  all: (userId: string | null, orgId: string | null) => ['teach', userId, orgId] as const,
  courses: (userId: string | null, orgId: string | null) => ['teach', userId, orgId, 'courses'] as const,
  queue: (userId: string | null, orgId: string | null) => ['teach', userId, orgId, 'grading-queue'] as const,
  submission: (userId: string | null, orgId: string | null, submissionId: string) =>
    ['teach', userId, orgId, 'submission', submissionId] as const,
  course: (userId: string | null, orgId: string | null, courseId: string) =>
    ['teach', userId, orgId, 'course', courseId] as const,
  analytics: (userId: string | null, orgId: string | null, courseId: string) =>
    ['teach', userId, orgId, 'course', courseId, 'analytics'] as const,
  newsfeed: (userId: string | null, orgId: string | null, courseId: string) =>
    ['teach', userId, orgId, 'course', courseId, 'newsfeed'] as const,
  checkInCode: (userId: string | null, orgId: string | null, courseId: string, lessonId: string) =>
    ['teach', userId, orgId, 'course', courseId, 'check-in', lessonId] as const,
  comments: (userId: string | null, orgId: string | null, courseId: string, feedId: string) =>
    ['teach', userId, orgId, 'course', courseId, 'newsfeed', feedId, 'comments'] as const
};
