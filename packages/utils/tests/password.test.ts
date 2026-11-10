import { describe, expect, it } from 'vitest';

import { ZPassword } from '../src/validation/auth/password';

describe('ZPassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(ZPassword.safeParse('short').success).toBe(false);
  });

  it('accepts a 72-byte password', () => {
    expect(ZPassword.safeParse('a'.repeat(72)).success).toBe(true);
  });

  it('rejects a 73-character password as over the byte limit', () => {
    const result = ZPassword.safeParse('a'.repeat(73));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validations.auth.password.max_bytes');
    }
  });

  it('rejects multibyte passwords over 72 bytes even when short in characters', () => {
    // 20 emoji are 80 UTF-8 bytes.
    const result = ZPassword.safeParse('🔑'.repeat(20));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validations.auth.password.max_bytes');
    }
  });
});
