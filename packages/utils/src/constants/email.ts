export const EMAIL_TEMPLATE_IDS = [
  'forgotPassword',
  'welcome',
  'verifyEmail',
  'onPasswordReset',
  'inviteTeacher',
  'newsfeedPost',
  'newsfeedComment',
  'studentCourseWelcome',
  'studentCourseInvite',
  'teacherStudentJoined',
  'teacherStudentBuyRequest',
  'studentProvePayment',
  'teacherCourseWelcome',
  'submissionStatusUpdate',
  'exerciseSubmissionReceived'
] as const;

export const REQUIRED_EMAIL_TEMPLATE_IDS = ['forgotPassword', 'verifyEmail', 'onPasswordReset'] as const;

export const EMAIL_TEMPLATE_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da'] as const;

export const DEFAULT_EMAIL_TEMPLATE_LOCALE = 'en' as const;

export type TEmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];
export type TRequiredEmailTemplateId = (typeof REQUIRED_EMAIL_TEMPLATE_IDS)[number];
export type TEmailTemplateLocale = (typeof EMAIL_TEMPLATE_LOCALES)[number];
