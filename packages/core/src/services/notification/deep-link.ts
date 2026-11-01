import type { TNotificationType } from '@cio/utils/constants/notifications';

type DeepLinkInput = {
  type: TNotificationType;
  entityId: string;
  courseId: string | null;
  subjectSlug: string | null;
};

/** In-app path a notification opens, shared by the notification list and the push payload. */
export function buildNotificationDeepLink({ type, entityId, courseId, subjectSlug }: DeepLinkInput): string {
  const coursePath = courseId ? `/course/${courseId}` : null;

  switch (type) {
    case 'course_enrolled':
      return coursePath ?? '/learn';
    case 'compliance_due_soon':
    case 'compliance_overdue':
    case 'compliance_renewal_due':
      return '/compliance';
    case 'newsfeed_post':
    case 'newsfeed_comment':
    case 'newsfeed_reply':
      return coursePath ? `${coursePath}/newsfeed/${entityId}` : '/home';
    case 'lesson_published':
    case 'live_session_reminder':
      return coursePath ? `${coursePath}/lesson/${entityId}` : '/home';
    case 'exercise_graded':
      return coursePath ? `${coursePath}/exercise/${entityId}` : '/home';
    case 'community_answer':
      return subjectSlug ? `/community/${encodeURIComponent(subjectSlug)}` : '/community';
    case 'certificate_issued':
      return courseId ? `/certificates/${courseId}` : '/certificates';
    case 'cohort_goal_due':
      return '/home';
  }
}
