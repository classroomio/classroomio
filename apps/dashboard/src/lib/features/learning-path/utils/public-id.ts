/**
 * Generates an 8-character mixed-case alphanumeric public identifier ([0-9A-Za-z])
 * conforming to the Learning Paths PRD requirement for publicId in dashboard and LMS URLs.
 *
 * @param length - Desired identifier length (defaults to 8)
 * @returns An 8-character alphanumeric string (e.g. '1GlQpMod')
 */
export function generatePublicId(length = 8): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      result += alphabet[bytes[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }

  return result;
}
