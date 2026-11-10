import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
