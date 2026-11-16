import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MEMBER_EMAIL_NOTIFICATION_ROW,
  TUTOR_ONLY_PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS,
  getToggleKeyForEmail,
  memberEmailNotificationRowToPersonalSettings,
  resolveEmailDelivery
} from '../src/notifications';

describe('courseComments email toggle', () => {
  it('maps the digest email to the courseComments toggle', () => {
    expect(getToggleKeyForEmail('courseCommentDigest')).toBe('courseComments');
  });

  it('is on by default and only shown to tutors and admins', () => {
    expect(DEFAULT_MEMBER_EMAIL_NOTIFICATION_ROW.courseComments).toBe(true);
    expect(TUTOR_ONLY_PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS).toContain('courseComments');
  });

  it('respects org and personal opt-outs', () => {
    expect(resolveEmailDelivery('courseCommentDigest')).toBe(true);
    expect(resolveEmailDelivery('courseCommentDigest', { courseComments: false })).toBe(false);

    const personal = memberEmailNotificationRowToPersonalSettings({
      ...DEFAULT_MEMBER_EMAIL_NOTIFICATION_ROW,
      courseComments: false
    });

    expect(resolveEmailDelivery('courseCommentDigest', {}, personal)).toBe(false);
  });
});
