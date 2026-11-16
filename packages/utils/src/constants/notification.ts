export const NOTIFICATION_KINDS = {
  courseCommentMentioned: 'course_comment.mentioned',
  courseCommentReplied: 'course_comment.replied',
  courseCommentResolved: 'course_comment.resolved'
} as const;

export type TNotificationKind = (typeof NOTIFICATION_KINDS)[keyof typeof NOTIFICATION_KINDS];

export const NOTIFICATION_KIND_VALUES = Object.values(NOTIFICATION_KINDS) as [
  TNotificationKind,
  ...TNotificationKind[]
];

export const NOTIFICATION_PAGE_MAX_LIMIT = 50;
