import { z } from 'zod';

const PROBE_ORIGIN = 'http://same-origin.invalid';
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/**
 * Returns true only for a root-relative path that stays on the current origin.
 * Rejects protocol-relative (`//host`), backslash and control-character forms
 * that browsers normalize into an off-origin URL.
 */
export function isSafeRelativePath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (value.includes('\\') || CONTROL_CHARACTERS.test(value)) return false;

  try {
    return new URL(value, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * Returns `value` when it is a safe same-origin relative path, otherwise `fallback`.
 */
export function toSafeRelativePath(value: unknown, fallback = '/'): string {
  return isSafeRelativePath(value) ? value : fallback;
}

export const ZSafeRedirectPath = z
  .string()
  .optional()
  .transform((value) => toSafeRelativePath(value));
