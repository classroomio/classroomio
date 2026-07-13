export const EMAIL_NOTIFICATION_TOGGLE_KEYS = [
  'newStudent',
  'newSubmission',
  'gradingResult',
  'newsfeed',
  'quizAssigned',
  'cohortReminder',
  'session',
  'enrollmentWelcome',
  'courseCompletion'
] as const;

export type EmailNotificationToggleKey = (typeof EMAIL_NOTIFICATION_TOGGLE_KEYS)[number];

export type PersonalEmailNotificationToggleKey = Exclude<EmailNotificationToggleKey, 'enrollmentWelcome'>;

export const PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS = EMAIL_NOTIFICATION_TOGGLE_KEYS.filter(
  (key): key is PersonalEmailNotificationToggleKey => key !== 'enrollmentWelcome'
);

export type EmailNotificationSectionId = 'course' | 'cohort' | 'enrollment';

export type EmailNotificationSection<TKey extends string = EmailNotificationToggleKey> = {
  id: EmailNotificationSectionId;
  keys: readonly TKey[];
};

export const PERSONAL_EMAIL_NOTIFICATION_SECTIONS: EmailNotificationSection<PersonalEmailNotificationToggleKey>[] = [
  {
    id: 'course',
    keys: ['newStudent', 'newSubmission', 'gradingResult', 'newsfeed', 'quizAssigned', 'session', 'courseCompletion']
  },
  {
    id: 'cohort',
    keys: ['cohortReminder']
  }
];

export const ORG_EMAIL_NOTIFICATION_SECTIONS: EmailNotificationSection[] = [
  {
    id: 'course',
    keys: ['newStudent', 'newSubmission', 'gradingResult', 'newsfeed', 'quizAssigned', 'session', 'courseCompletion']
  },
  {
    id: 'cohort',
    keys: ['cohortReminder']
  },
  {
    id: 'enrollment',
    keys: ['enrollmentWelcome']
  }
];

export type EmailNotificationSettings = Partial<Record<EmailNotificationToggleKey, boolean>>;

export type PersonalEmailNotificationSettings = Partial<Record<PersonalEmailNotificationToggleKey, boolean>>;

export const EMAIL_TOGGLE_MAP = {
  teacherStudentJoined: 'newStudent',
  submissionReceived: 'newSubmission',
  submissionGraded: 'gradingResult',
  newsfeedPost: 'newsfeed',
  newsfeedComment: 'newsfeed',
  quizAssigned: 'quizAssigned',
  cohortGoalReminder: 'cohortReminder',
  sessionReminder: 'session',
  sessionUpdated: 'session',
  studentCourseWelcome: 'enrollmentWelcome',
  studentCohortWelcome: 'enrollmentWelcome',
  teacherCourseWelcome: 'enrollmentWelcome',
  studentCourseCompletion: 'courseCompletion'
} as const satisfies Record<string, EmailNotificationToggleKey>;

export type ToggleableEmailId = keyof typeof EMAIL_TOGGLE_MAP;

export function getToggleKeyForEmail(emailId: string): EmailNotificationToggleKey | undefined {
  return EMAIL_TOGGLE_MAP[emailId as ToggleableEmailId];
}

export function isMandatoryEmail(emailId: string): boolean {
  return getToggleKeyForEmail(emailId) === undefined;
}

/**
 * Pure preference resolution. Absent keys resolve to allowed (opt-out default).
 */
export function resolveEmailDelivery(
  emailId: string,
  orgSettings?: EmailNotificationSettings | null,
  personalSettings?: PersonalEmailNotificationSettings | null
): boolean {
  const toggleKey = getToggleKeyForEmail(emailId);

  if (!toggleKey) {
    return true;
  }

  if (orgSettings?.[toggleKey] === false) {
    return false;
  }

  if (toggleKey === 'enrollmentWelcome') {
    return true;
  }

  if (personalSettings?.[toggleKey] === false) {
    return false;
  }

  return true;
}
