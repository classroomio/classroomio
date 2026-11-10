import bcrypt from 'bcrypt';
import { APIError } from 'better-auth/api';

const BCRYPT_ROUNDS = 10;

/**
 * bcrypt only reads the first 72 UTF-8 bytes of its input. Mirrors
 * PASSWORD_MAX_BYTES in `@cio/utils/validation/auth/password` (kept separate
 * because the utils package exports validation directories, not files).
 */
const BCRYPT_MAX_BYTES = 72;

/**
 * Placeholder burned for timing when the input cannot be hashed (below): one
 * bcrypt round-trip keeps that path indistinguishable by duration from a real
 * verification.
 */
const BCRYPT_TIMING_PLACEHOLDER = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(password: string): Promise<string> {
  if (new TextEncoder().encode(password).length > BCRYPT_MAX_BYTES) {
    // bcrypt only reads the first 72 UTF-8 bytes, so a longer input would
    // silently truncate and two passwords differing past that point could
    // match the same account. Fail closed on the exact error better-auth
    // returns for a wrong password (sign-in uses this same call as its
    // timing dummy when no credential exists), so missing-account and
    // wrong-password attempts stay indistinguishable in status, body and
    // duration. Existing accounts keep verifying through `verifyPassword`,
    // which is untouched.
    await bcrypt.hash(BCRYPT_TIMING_PLACEHOLDER, BCRYPT_ROUNDS);
    throw APIError.from('UNAUTHORIZED', 'Invalid email or password' as never);
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
