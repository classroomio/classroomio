import { useQueryClient } from '@tanstack/react-query';

import type { AuthClient } from '@/feature/auth/api/auth-client';
import { authErrorMessage } from '@/feature/auth/helpers/auth-error';
import { emailDomainOf } from '@/feature/auth/helpers/email';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { useServer } from '@/feature/server/components/server-provider';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';

export const ssoDiscoveryQueryKey = (serverUrl: string, domain: string) =>
  ['sso-discovery', serverUrl, domain] as const;

/** Returns a lookup of the SSO setup for an email's domain, cached per server and domain. */
export function useSsoDiscovery() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { serverUrl } = useServer();

  return (email: string) =>
    queryClient.fetchQuery({
      queryKey: ssoDiscoveryQueryKey(serverUrl, emailDomainOf(email)),
      queryFn: async () => {
        const response = await request(api.sso.discover.$get({ query: { email: email.trim().toLowerCase() } }));

        return response.data;
      },
      staleTime: 5 * 60 * 1000
    });
}

type SsoSignInInput = { email: string; providerId: string | null };

/**
 * Opens the identity provider in the system browser; the expo client plugin stores the session when it returns.
 * Resolves `signedIn: false` when the browser was closed or the provider reported an error.
 */
export async function signInWithSso(client: AuthClient, { email, providerId }: SsoSignInInput) {
  const result = await client.$fetch<{ url: string; redirect: boolean }>('/sign-in/sso', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
      ...(providerId ? { providerId } : {}),
      callbackURL: '/',
      errorCallbackURL: '/'
    }
  });

  if (result.error)
    throw new Error(
      authErrorMessage(result.error, createTranslator(authCatalog, getCurrentLocale())('ssoCouldNotStart'))
    );

  const session = await client.getSession();

  return { signedIn: Boolean(session.data?.user) };
}
