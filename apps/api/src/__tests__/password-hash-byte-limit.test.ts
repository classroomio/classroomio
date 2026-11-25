import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@cio/db/auth/password';

describe('hashPassword byte limit', () => {
  it('hashes a 72-byte password so it verifies', async () => {
    const hash = await hashPassword('a'.repeat(72));

    await expect(verifyPassword(hash, 'a'.repeat(72))).resolves.toBe(true);
  });

  it('rejects an overlength password with the invalid-credentials error', async () => {
    try {
      await hashPassword('é'.repeat(40));
      expect.unreachable('overlength passwords must not hash');
    } catch (error) {
      expect((error as { statusCode?: number }).statusCode).toBe(401);
      expect((error as { body?: unknown }).body).toEqual({
        message: 'Invalid email or password',
        code: 'INVALID_EMAIL_OR_PASSWORD'
      });
    }
  });

  it('still verifies longer input that shares the first 72 bytes', async () => {
    const hash = await hashPassword('c'.repeat(72));

    await expect(verifyPassword(hash, 'c'.repeat(100))).resolves.toBe(true);
  });
});
