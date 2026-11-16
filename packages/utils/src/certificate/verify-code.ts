export const VERIFY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const VERIFY_CODE_LENGTH = 8;

export const VERIFY_CODE_DISPLAY_SEPARATOR = '-';

export const VERIFY_CODE_DISPLAY_PATTERN =
  /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

const VERIFY_ALPHABET_SET = new Set(VERIFY_ALPHABET);

export function normalizeVerifyCode(input: string | null | undefined): string | null {
  if (!input) return null;

  const normalized = input.toUpperCase().replace(/[\s-]+/g, '');

  if (normalized.length !== VERIFY_CODE_LENGTH) return null;

  for (const char of normalized) {
    if (!VERIFY_ALPHABET_SET.has(char)) return null;
  }

  return normalized;
}

export function formatVerifyCode(code: string): string {
  const normalized = code.toUpperCase().replace(/[\s-]+/g, '');
  if (normalized.length !== VERIFY_CODE_LENGTH) return code.toUpperCase();

  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function isValidVerifyCodeAlphabet(input: string): boolean {
  if (input.length !== VERIFY_CODE_LENGTH) return false;

  for (const char of input) {
    if (!VERIFY_ALPHABET_SET.has(char)) return false;
  }

  return true;
}

export function generateVerifyCode(): string {
  const alphabetLength = VERIFY_ALPHABET.length;
  const maxValidByte = 256 - (256 % alphabetLength);
  const bytes = new Uint8Array(VERIFY_CODE_LENGTH * 2);
  let code = '';

  while (code.length < VERIFY_CODE_LENGTH) {
    crypto.getRandomValues(bytes);

    for (let index = 0; index < bytes.length && code.length < VERIFY_CODE_LENGTH; index += 1) {
      const byte = bytes[index];
      if (byte >= maxValidByte) continue;

      code += VERIFY_ALPHABET[byte % alphabetLength];
    }
  }

  return code;
}

export async function generateUniqueVerifyCode(
  exists: (code: string) => Promise<boolean>,
  maxAttempts = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateVerifyCode();
    const alreadyExists = await exists(code);

    if (!alreadyExists) return code;
  }

  throw new Error('Failed to generate unique verify code after maximum attempts');
}
