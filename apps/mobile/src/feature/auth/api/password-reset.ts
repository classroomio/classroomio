import type { AuthClient } from '@/feature/auth/api/auth-client';
import { authErrorMessage } from '@/feature/auth/helpers/auth-error';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';

/** Emails a reset link; the server points it at the web dashboard's reset page for this deployment. */
export async function requestPasswordReset(client: AuthClient, email: string) {
  const { error } = await client.requestPasswordReset({ email: email.trim().toLowerCase() });

  if (error)
    throw new Error(authErrorMessage(error, createTranslator(authCatalog, getCurrentLocale())('resetEmailFailed')));
}
