import type { TNotificationType } from '@cio/utils/constants/notifications';

import { getAppBaseUrl } from '../../config/dashboard-url';

type DeepLinkInput = {
  type: TNotificationType;
  entityId: string;
  courseId: string | null;
  subjectSlug: string | null;
};

function dashboardUrl(siteName: string | null, path: string) {
  const base = getAppBaseUrl();

  return siteName ? `${base}/org/${encodeURIComponent(siteName)}${path}` : base;
}

/**
 * In-app path a notification opens, shared by the notification list and the push payload. Admin billing and
 * integration notifications open the web dashboard instead (an absolute URL), because those settings live on the web.
 * `subjectSlug` is the community question slug, or the organization's site name for organization and webhook types.
 */
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
    case 'live_class_starting':
      return coursePath ? `${coursePath}/lesson/${entityId}` : '/home';
    case 'exercise_graded':
    case 'assignment_new':
    case 'assignment_due_soon':
      return coursePath ? `${coursePath}/exercise/${entityId}` : '/home';
    case 'course_recommended':
      return `/explore/${entityId}`;
    case 'streak_at_risk':
    case 'weekly_goal_reached':
      return '/goals';
    case 'community_answer':
      return subjectSlug ? `/community/${encodeURIComponent(subjectSlug)}` : '/community';
    case 'certificate_issued':
      return courseId ? `/certificates/${courseId}` : '/certificates';
    case 'cohort_goal_due':
      return '/home';
    case 'learner_nudged':
      return coursePath ?? '/home';
    case 'submission_received':
      return `/submissions/${entityId}`;
    case 'live_session_host_reminder':
    case 'attendance_reminder':
      return courseId ? `/courses/${courseId}/attendance?lessonId=${entityId}` : '/home';
    case 'learner_needs_nudge':
      return '/learners?filter=needs-nudge';
    case 'student_joined':
      return courseId ? `/courses/${courseId}/people` : '/courses';
    case 'tutor_added':
      return courseId ? `/courses/${courseId}` : '/courses';
    case 'student_limit_approaching':
    case 'student_limit_reached':
      return dashboardUrl(subjectSlug, '?upgrade=true');
    case 'payment_failed':
      return dashboardUrl(subjectSlug, '/settings/billing');
    case 'webhook_failing':
    case 'webhook_disabled':
      return dashboardUrl(subjectSlug, '/automation/webhooks');
  }
}
