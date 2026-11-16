import { describe, expect, it, vi } from 'vitest';

import {
  VERIFY_ALPHABET,
  VERIFY_CODE_LENGTH,
  formatVerifyCode,
  generateUniqueVerifyCode,
  generateVerifyCode,
  isValidVerifyCodeAlphabet,
  normalizeVerifyCode
} from '../src/certificate/verify-code';

describe('verify-code', () => {
  it('alphabet has 31 characters and excludes 0,1,I,L,O', () => {
    expect(VERIFY_ALPHABET.length).toBe(31);
    expect(VERIFY_ALPHABET).toBe('23456789ABCDEFGHJKMNPQRSTUVWXYZ');
    for (const char of ['0', '1', 'I', 'L', 'O']) {
      expect(VERIFY_ALPHABET).not.toContain(char);
    }
  });

  it('code length is 8 and space is 31^8 = 852891037441', () => {
    expect(VERIFY_CODE_LENGTH).toBe(8);
    expect(31 ** 8).toBe(852_891_037_441);
  });

  it('normalizeVerifyCode uppercases and strips hyphens/spaces', () => {
    expect(normalizeVerifyCode('7kqm-4xh2')).toBe('7KQM4XH2');
    expect(normalizeVerifyCode('b6zc p8vg')).toBe('B6ZCP8VG');
    expect(normalizeVerifyCode(' 7KQM4XH2 ')).toBe('7KQM4XH2');
    expect(normalizeVerifyCode('7KQM--4XH2')).toBe('7KQM4XH2');
  });

  it('normalizeVerifyCode rejects invalid alphabet or wrong length', () => {
    expect(normalizeVerifyCode('')).toBeNull();
    expect(normalizeVerifyCode('7KQM-4XH')).toBeNull();
    expect(normalizeVerifyCode('7KQM-4XH22')).toBeNull();
    expect(normalizeVerifyCode('0000-0000')).toBeNull();
    expect(normalizeVerifyCode('1111-1111')).toBeNull();
    expect(normalizeVerifyCode('7KQM-4XH1')).toBeNull();
    expect(normalizeVerifyCode('7KQM-I4H2')).toBeNull();
    expect(normalizeVerifyCode('7KQM-O4H2')).toBeNull();
    expect(normalizeVerifyCode(null)).toBeNull();
  });

  it('formatVerifyCode inserts hyphen', () => {
    expect(formatVerifyCode('7KQM4XH2')).toBe('7KQM-4XH2');
    expect(formatVerifyCode('7kqm4xh2')).toBe('7KQM-4XH2');
  });

  it('isValidVerifyCodeAlphabet checks length and alphabet', () => {
    expect(isValidVerifyCodeAlphabet('7KQM4XH2')).toBe(true);
    expect(isValidVerifyCodeAlphabet('7KQM4XH')).toBe(false);
    expect(isValidVerifyCodeAlphabet('7KQM1XH2')).toBe(false);
  });

  it('generateVerifyCode uses only allowed alphabet and length 8', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateVerifyCode();
      expect(code.length).toBe(8);
      expect(isValidVerifyCodeAlphabet(code)).toBe(true);
    }
  });

  it('generateUniqueVerifyCode retries on collision and throws after max', async () => {
    const exists = vi.fn().mockResolvedValue(true);
    await expect(generateUniqueVerifyCode(exists, 3)).rejects.toThrow(/Failed to generate unique verify code/);
    expect(exists).toHaveBeenCalledTimes(3);
  });

  it('generateUniqueVerifyCode returns on second attempt', async () => {
    const exists = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const code = await generateUniqueVerifyCode(exists, 5);
    expect(code.length).toBe(8);
    expect(exists).toHaveBeenCalledTimes(2);
  });
});
