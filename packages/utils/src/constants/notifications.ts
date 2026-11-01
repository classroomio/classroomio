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
  'live_session'
] as const;

export type TNotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_ENTITY_TYPES = [
  'course',
  'lesson',
  'exercise',
  'newsfeed_post',
  'community_question',
  'compliance_record',
  'cohort_goal_assignment'
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
  live_session_reminder: { category: 'live_session', entityType: 'lesson' }
} as const satisfies Record<string, { category: TNotificationCategory; entityType: TNotificationEntityType }>;

export type TNotificationType = keyof typeof NOTIFICATION_TYPE_CONFIG;

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_CONFIG) as TNotificationType[];

/**
 * How a category behaves for delivery.
 * - `emailToggle`: the per-org-member email toggle that governs this category's existing email, or null when the
 *   category sends no email.
 * - `locked`: push and in-app cannot be turned off.
 * - `quietHours`: `defer` holds the push until quiet hours end; `drop` skips it because it would arrive too late.
 */
export const NOTIFICATION_CATEGORY_CONFIG = {
  course_assigned: { emailToggle: null, locked: false, quietHours: 'defer' },
  deadline_reminder: { emailToggle: null, locked: false, quietHours: 'defer' },
  overdue: { emailToggle: null, locked: true, quietHours: 'defer' },
  renewal_due: { emailToggle: null, locked: false, quietHours: 'defer' },
  new_content: { emailToggle: 'newsfeed', locked: false, quietHours: 'defer' },
  exercise_graded: { emailToggle: 'gradingResult', locked: false, quietHours: 'defer' },
  community_reply: { emailToggle: null, locked: false, quietHours: 'defer' },
  certificate_issued: { emailToggle: 'courseCompletion', locked: false, quietHours: 'defer' },
  cohort_goal: { emailToggle: 'cohortReminder', locked: false, quietHours: 'defer' },
  live_session: { emailToggle: 'session', locked: false, quietHours: 'drop' }
} as const satisfies Record<
  TNotificationCategory,
  {
    emailToggle: PersonalEmailNotificationToggleKey | null;
    locked: boolean;
    quietHours: 'defer' | 'drop';
  }
>;

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
