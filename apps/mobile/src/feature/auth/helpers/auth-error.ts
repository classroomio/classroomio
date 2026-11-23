import { authCatalog } from '@/feature/auth/translations/catalog';
import type { en } from '@/feature/auth/translations/en';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

type AuthClientError = { message?: string; code?: string; error?: unknown; status?: number };

const KNOWN_CODES: Record<string, keyof typeof en> = {
  INVALID_EMAIL: 'invalidEmail',
  INVALID_EMAIL_OR_PASSWORD: 'invalidCredentials',
  EMAIL_NOT_VERIFIED: 'emailNotVerified',
  USER_ALREADY_EXISTS: 'accountExists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'accountExists'
};

const EMAIL_FIELD_CODES = new Set(['INVALID_EMAIL', 'USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL']);

const PASSWORD_FIELD_CODES = new Set(['PASSWORD_TOO_SHORT', 'PASSWORD_TOO_LONG']);

/** True when Better Auth rejected the email address itself, so the message belongs on the email field. */
export function isEmailFieldError(error: AuthClientError) {
  return Boolean(error.code && EMAIL_FIELD_CODES.has(error.code));
}

/** True when Better Auth rejected the password's length, so the message belongs on the password field. */
export function isPasswordFieldError(error: AuthClientError) {
  return Boolean(error.code && PASSWORD_FIELD_CODES.has(error.code));
}

/** Better Auth errors carry `message` and `code`; ClassroomIO's auth guards answer with `{ error }` instead. */
export function authErrorMessage(error: AuthClientError, fallback: string, locale: Locale = getCurrentLocale()) {
  const t = createTranslator(authCatalog, locale);
  const knownKey = error.code ? KNOWN_CODES[error.code] : undefined;
  if (knownKey) return t(knownKey);
  if (error.status === 429) return t('tooManyAttempts');
  if (error.message) return error.message;
  if (typeof error.error === 'string' && error.error) return error.error;

  return fallback;
}
