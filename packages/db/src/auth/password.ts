import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

/**
 * bcrypt only reads the first 72 UTF-8 bytes of its input. Longer passwords
 * would silently truncate, so two passwords that differ past that point could
 * match the same account. Reject them here, in the single function every
 * password flow (signup, reset, change, admin scripts) hashes through.
 */
const BCRYPT_MAX_BYTES = 72;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(password: string): Promise<string> {
  if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
    throw new Error('Password must not exceed 72 UTF-8 bytes.');
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
