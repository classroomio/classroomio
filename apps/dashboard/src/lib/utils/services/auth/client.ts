import { createAuthClient } from 'better-auth/svelte';
import { getRequestBaseUrl } from '$lib/utils/services/api';
import { ssoClient } from '@better-auth/sso/client';

// Server: PRIVATE_SERVER_URL (Render internal). Browser: same-origin /api
// through the Cloudflare Worker proxy, so auth cookies stay host-only on
// whichever domain the user is on (app, tenant subdomain, or BYOD).
export const authClient = createAuthClient({
  baseURL: getRequestBaseUrl(),
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
