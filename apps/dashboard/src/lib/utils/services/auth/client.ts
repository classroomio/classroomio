import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { ssoClient } from '@better-auth/sso/client';

export const authClient = createAuthClient({
  baseURL: env.PUBLIC_SERVER_URL,
  fetchOptions: {
    credentials: 'include' // Include cookies in requests
  },
  plugins: [
    ssoClient({
      domainVerification: {
        enabled: true
      }
    })
  ]
});
