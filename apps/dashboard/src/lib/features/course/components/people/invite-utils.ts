import type { InvitePreset, InviteStatus } from './types';

const INVITE_PRESET_LABEL_KEYS: Record<InvitePreset, string> = {
  ONE_TIME_24H: 'course.navItem.people.invite_modal.presets.one_time_24h',
  MULTI_USE_7D: 'course.navItem.people.invite_modal.presets.multi_use_7d',
  MULTI_USE_30D: 'course.navItem.people.invite_modal.presets.multi_use_30d',
  CUSTOM: 'course.navItem.people.invite_modal.presets.custom'
};

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'n/a';
  return new Date(date).toLocaleString();
}

export function shortId(id: string): string {
  return `${id.slice(0, 8)}...`;
}

export function getStatusClass(status: InviteStatus): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'REVOKED') return 'bg-red-100 text-red-700';
  if (status === 'EXPIRED') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
}

export function getPresetLabelKey(preset: InvitePreset): string {
  return INVITE_PRESET_LABEL_KEYS[preset];
}

export interface InvitePayloadInput {
  preset: InvitePreset;
  customExpiresAt: string;
  customMaxUses: number;
}

export function getInvitePayload(input: InvitePayloadInput): {
  preset: InvitePreset;
  expiresAt?: string;
  maxUses?: number;
} {
  const { preset, customExpiresAt, customMaxUses } = input;
  const payload: { preset: InvitePreset; expiresAt?: string; maxUses?: number } = {
    preset
  };

  if (preset === 'CUSTOM') {
    if (!customExpiresAt) {
      throw new Error('Custom expiry date is required');
    }
    payload.expiresAt = new Date(customExpiresAt).toISOString();
    payload.maxUses = customMaxUses;
  }

  return payload;
}

export interface InviteOutcomeRow {
  email: string;
  /** Translation key for the outcome label. */
  labelKey: string;
}

/** Translation key per assign-courses outcome status. */
export const ASSIGN_OUTCOME_LABEL_KEYS: Record<string, string> = {
  enrolled: 'course.navItem.people.invite_modal.outcomes.enrolled',
  already_enrolled: 'course.navItem.people.invite_modal.outcomes.already_enrolled',
  invited: 'course.navItem.people.invite_modal.outcomes.invited',
  is_staff: 'audience.import.status.is_staff',
  archived: 'course.navItem.people.invite_modal.outcomes.archived',
  over_seat_limit: 'audience.import.status.over_seat_limit',
  not_found: 'course.navItem.people.invite_modal.outcomes.not_found'
};

/** Translation key per course email-invite recipient status. */
export const COURSE_INVITE_OUTCOME_LABEL_KEYS: Record<string, string> = {
  invited: 'course.navItem.people.invite_modal.outcomes.invited',
  already_invited: 'audience.import.status.already_invited',
  enrolled: 'course.navItem.people.invite_modal.outcomes.enrolled',
  already_enrolled: 'course.navItem.people.invite_modal.outcomes.already_enrolled',
  is_staff: 'audience.import.status.is_staff',
  archived: 'course.navItem.people.invite_modal.outcomes.archived',
  over_seat_limit: 'audience.import.status.over_seat_limit',
  invalid_email: 'audience.import.status.invalid_email',
  duplicate: 'audience.import.status.duplicate_in_file'
};

/** Emails whose invitation email could not be queued, lowercased for matching against recipients. */
export function getFailedDeliveryEmails(delivery: { failures: { email: string }[] }): Set<string> {
  return new Set(delivery.failures.map((failure) => failure.email.toLowerCase()));
}

/** Translation key for one course email-invite recipient, reporting a failed email over the recipient status. */
export function getCourseInviteOutcomeLabelKey(
  recipient: { email: string; status: string },
  failedEmails: Set<string>
): string {
  if (failedEmails.has(recipient.email.toLowerCase())) return 'course.navItem.people.invite_modal.email_failed';

  return COURSE_INVITE_OUTCOME_LABEL_KEYS[recipient.status] ?? COURSE_INVITE_OUTCOME_LABEL_KEYS.invited;
}

/** Translation key for one audience-import row outcome when people are invited to a course or cohort. */
export function getImportOutcomeLabelKey(row: {
  status: string;
  enrollment?: 'enrolled' | 'already_enrolled';
}): string {
  if (row.status === 'ready') return COURSE_INVITE_OUTCOME_LABEL_KEYS.invited;
  if (row.status === 'already_member') {
    return row.enrollment === 'enrolled'
      ? COURSE_INVITE_OUTCOME_LABEL_KEYS.enrolled
      : COURSE_INVITE_OUTCOME_LABEL_KEYS.already_enrolled;
  }

  return `audience.import.status.${row.status}`;
}

export const INVITE_PRESET_OPTIONS: Array<{ value: InvitePreset; labelKey: string }> = [
  { value: 'ONE_TIME_24H', labelKey: 'course.navItem.people.invite_modal.presets.one_time_24h' },
  { value: 'MULTI_USE_7D', labelKey: 'course.navItem.people.invite_modal.presets.multi_use_7d' },
  { value: 'MULTI_USE_30D', labelKey: 'course.navItem.people.invite_modal.presets.multi_use_30d' },
  { value: 'CUSTOM', labelKey: 'course.navItem.people.invite_modal.presets.custom' }
];
