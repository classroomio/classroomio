import type { PersonalEmailNotificationToggleKey } from '../notifications/email-toggles';

export const NOTIFICATION_CATEGORIES = [
  'course_assigned',
  'deadline_reminder',
  'overdue',
  'renewal_due',
  'new_content',
  'exercise_graded',
  'community_reply',
  'certificate_issued',
  'cohort_goal',
  'live_session',
  'new_assignment',
  'recommendation',
  'goals',
  'tutor_reminder',
  'grading',
  'new_student',
  'learner_attention',
  'attendance',
  'course_team',
  'plan_limits',
  'billing',
  'integrations'
] as const;

export type TNotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_ENTITY_TYPES = [
  'course',
  'lesson',
  'exercise',
  'newsfeed_post',
  'community_question',
  'compliance_record',
  'cohort_goal_assignment',
  'learner_goal',
  'submission',
  'organization',
  'webhook'
] as const;

export type TNotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

export const NOTIFICATION_TYPE_CONFIG = {
  course_enrolled: { category: 'course_assigned', entityType: 'course' },
  compliance_due_soon: { category: 'deadline_reminder', entityType: 'compliance_record' },
  compliance_overdue: { category: 'overdue', entityType: 'compliance_record' },
  compliance_renewal_due: { category: 'renewal_due', entityType: 'compliance_record' },
  newsfeed_post: { category: 'new_content', entityType: 'newsfeed_post' },
  lesson_published: { category: 'new_content', entityType: 'lesson' },
  exercise_graded: { category: 'exercise_graded', entityType: 'exercise' },
  community_answer: { category: 'community_reply', entityType: 'community_question' },
  newsfeed_comment: { category: 'community_reply', entityType: 'newsfeed_post' },
  newsfeed_reply: { category: 'community_reply', entityType: 'newsfeed_post' },
  certificate_issued: { category: 'certificate_issued', entityType: 'course' },
  cohort_goal_due: { category: 'cohort_goal', entityType: 'cohort_goal_assignment' },
  live_session_reminder: { category: 'live_session', entityType: 'lesson' },
  live_class_starting: { category: 'live_session', entityType: 'lesson' },
  assignment_new: { category: 'new_assignment', entityType: 'exercise' },
  assignment_due_soon: { category: 'deadline_reminder', entityType: 'exercise' },
  course_recommended: { category: 'recommendation', entityType: 'course' },
  streak_at_risk: { category: 'goals', entityType: 'learner_goal' },
  weekly_goal_reached: { category: 'goals', entityType: 'learner_goal' },
  learner_nudged: { category: 'tutor_reminder', entityType: 'course' },
  submission_received: { category: 'grading', entityType: 'submission' },
  live_session_host_reminder: { category: 'live_session', entityType: 'lesson' },
  learner_needs_nudge: { category: 'learner_attention', entityType: 'course' },
  attendance_reminder: { category: 'attendance', entityType: 'lesson' },
  student_joined: { category: 'new_student', entityType: 'course' },
  tutor_added: { category: 'course_team', entityType: 'course' },
  student_limit_approaching: { category: 'plan_limits', entityType: 'organization' },
  student_limit_reached: { category: 'plan_limits', entityType: 'organization' },
  payment_failed: { category: 'billing', entityType: 'organization' },
  webhook_failing: { category: 'integrations', entityType: 'webhook' },
  webhook_disabled: { category: 'integrations', entityType: 'webhook' }
} as const satisfies Record<string, { category: TNotificationCategory; entityType: TNotificationEntityType }>;

export type TNotificationType = keyof typeof NOTIFICATION_TYPE_CONFIG;

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_CONFIG) as TNotificationType[];

export const NOTIFICATION_AUDIENCE_ROLES = ['student', 'tutor', 'admin'] as const;

export type TNotificationAudienceRole = (typeof NOTIFICATION_AUDIENCE_ROLES)[number];

/**
 * How a category behaves for delivery.
 * - `emailToggle`: the per-org-member email toggle that governs this category's existing email, or null when the
 *   category sends no email.
 * - `locked`: push and in-app cannot be turned off.
 * - `quietHours`: `defer` holds the push until quiet hours end; `drop` skips it because it would arrive too late.
 * - `roles`: the org roles whose preferences list the category.
 */
export const NOTIFICATION_CATEGORY_CONFIG = {
  course_assigned: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  deadline_reminder: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  overdue: { emailToggle: null, locked: true, quietHours: 'defer', roles: ['student'] },
  renewal_due: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  new_content: { emailToggle: 'newsfeed', locked: false, quietHours: 'defer', roles: ['student'] },
  exercise_graded: { emailToggle: 'gradingResult', locked: false, quietHours: 'defer', roles: ['student'] },
  community_reply: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  certificate_issued: { emailToggle: 'courseCompletion', locked: false, quietHours: 'defer', roles: ['student'] },
  cohort_goal: { emailToggle: 'cohortReminder', locked: false, quietHours: 'defer', roles: ['student'] },
  live_session: { emailToggle: 'session', locked: false, quietHours: 'drop', roles: ['student', 'tutor', 'admin'] },
  tutor_reminder: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  grading: { emailToggle: 'newSubmission', locked: false, quietHours: 'defer', roles: ['tutor'] },
  new_student: { emailToggle: 'newStudent', locked: false, quietHours: 'defer', roles: ['tutor'] },
  learner_attention: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['tutor'] },
  attendance: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['tutor', 'admin'] },
  course_team: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['tutor'] },
  plan_limits: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['admin'] },
  billing: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['admin'] },
  integrations: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['admin'] },
  new_assignment: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  recommendation: { emailToggle: null, locked: false, quietHours: 'defer', roles: ['student'] },
  goals: { emailToggle: null, locked: false, quietHours: 'drop', roles: ['student'] }
} as const satisfies Record<
  TNotificationCategory,
  {
    emailToggle: PersonalEmailNotificationToggleKey | null;
    locked: boolean;
    quietHours: 'defer' | 'drop';
    roles: readonly TNotificationAudienceRole[];
  }
>;

/** The org role a category is meant for; the preferences screen lists only the viewer's categories. */
export function notificationCategoriesForRole(role: TNotificationAudienceRole): TNotificationCategory[] {
  return NOTIFICATION_CATEGORIES.filter((category) =>
    (NOTIFICATION_CATEGORY_CONFIG[category].roles as readonly TNotificationAudienceRole[]).includes(role)
  );
}

export function notificationCategoryOf(type: TNotificationType): TNotificationCategory {
  return NOTIFICATION_TYPE_CONFIG[type].category;
}

export function notificationTypesInCategories(categories: readonly TNotificationCategory[]): TNotificationType[] {
  return NOTIFICATION_TYPES.filter((type) => categories.includes(notificationCategoryOf(type)));
}

export function isNotificationType(value: string): value is TNotificationType {
  return value in NOTIFICATION_TYPE_CONFIG;
}

export const DEVICE_PLATFORMS = ['ios', 'android'] as const;

export type TDevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export const PUSH_PROVIDERS = ['expo'] as const;

export type TPushProvider = (typeof PUSH_PROVIDERS)[number];

export const MINUTES_PER_DAY = 24 * 60;
