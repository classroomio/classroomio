import { describe, expect, it } from 'vitest';

import { isSelfEnrollmentAllowed } from '../src/functions/course-enrollment';

describe('isSelfEnrollmentAllowed', () => {
  it('is true when neither key is set', () => {
    expect(isSelfEnrollmentAllowed({})).toBe(true);
  });

  it('is true for null or undefined metadata', () => {
    expect(isSelfEnrollmentAllowed(null)).toBe(true);
    expect(isSelfEnrollmentAllowed(undefined)).toBe(true);
  });

  it('honours the current key', () => {
    expect(isSelfEnrollmentAllowed({ allowSelfEnrollment: true })).toBe(true);
    expect(isSelfEnrollmentAllowed({ allowSelfEnrollment: false })).toBe(false);
  });

  it('falls back to the legacy key when the current one is absent', () => {
    expect(isSelfEnrollmentAllowed({ allowNewStudent: true })).toBe(true);
    expect(isSelfEnrollmentAllowed({ allowNewStudent: false })).toBe(false);
  });

  it('prefers the current key over the legacy one', () => {
    expect(isSelfEnrollmentAllowed({ allowSelfEnrollment: false, allowNewStudent: true })).toBe(false);
    expect(isSelfEnrollmentAllowed({ allowSelfEnrollment: true, allowNewStudent: false })).toBe(true);
  });

  it('treats a stored null as unset and falls through', () => {
    expect(isSelfEnrollmentAllowed({ allowSelfEnrollment: null, allowNewStudent: false })).toBe(false);
    expect(isSelfEnrollmentAllowed({ allowSelfEnrollment: null, allowNewStudent: null })).toBe(true);
  });
});
