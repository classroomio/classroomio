import type { PersonalEmailNotificationSettings, PersonalEmailNotificationToggleKey } from './email-toggles';
import { PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS } from './email-toggles';

export type MemberEmailNotificationRow = {
  newStudent: boolean;
  newSubmission: boolean;
  gradingResult: boolean;
  newsfeed: boolean;
  quizAssigned: boolean;
  cohortReminder: boolean;
  session: boolean;
  courseCompletion: boolean;
};

export const DEFAULT_MEMBER_EMAIL_NOTIFICATION_ROW: MemberEmailNotificationRow = {
  newStudent: true,
  newSubmission: true,
  gradingResult: true,
  newsfeed: true,
  quizAssigned: true,
  cohortReminder: true,
  session: true,
  courseCompletion: true
};

export function memberEmailNotificationRowToPersonalSettings(
  row: MemberEmailNotificationRow | null | undefined
): PersonalEmailNotificationSettings | undefined {
  if (!row) {
    return undefined;
  }

  const settings: Partial<Record<PersonalEmailNotificationToggleKey, boolean>> = {};

  for (const key of PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS) {
    if (row[key] === false) {
      settings[key] = false;
    }
  }

  return settings;
}

export function personalSettingsToMemberEmailNotificationRow(
  preferences: Partial<PersonalEmailNotificationSettings> | MemberEmailNotificationRow
): MemberEmailNotificationRow {
  return {
    newStudent: preferences.newStudent ?? true,
    newSubmission: preferences.newSubmission ?? true,
    gradingResult: preferences.gradingResult ?? true,
    newsfeed: preferences.newsfeed ?? true,
    quizAssigned: preferences.quizAssigned ?? true,
    cohortReminder: preferences.cohortReminder ?? true,
    session: preferences.session ?? true,
    courseCompletion: preferences.courseCompletion ?? true
  };
}

export function memberEmailNotificationRowToApiResponse(row: MemberEmailNotificationRow | null | undefined) {
  return personalSettingsToMemberEmailNotificationRow(row ?? DEFAULT_MEMBER_EMAIL_NOTIFICATION_ROW);
}
