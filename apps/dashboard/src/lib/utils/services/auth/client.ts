import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { ssoClient } from '@better-auth/sso/client';
import { dev } from '$app/environment';

// Browser baseURL depends on deployment shape:
//
//   - Self-hosted: dashboard and API are on different subdomains under
//     one apex. Browser calls go straight to PUBLIC_SERVER_URL; cookies
//     cross subdomains via AUTH_COOKIE_DOMAIN. No Worker proxy.
//
//   - Cloud (multi-tenant): same-origin via the Cloudflare Worker so
//     auth cookies stay host-only on whichever tenant/BYOD domain the
//     user is on. We encode `<origin>/proxy/api/auth` because Better
//     Auth's client treats any baseURL with a path as the full auth
//     root verbatim (won't auto-append `/api/auth`).
//
// SSR: `authClient` methods are never invoked server-side (the dashboard
// uses `authServerClient` for that), but Better Auth's constructor still
// validates baseURL with `new URL(...)`, so we hand it the public API
// URL as an absolute-URL placeholder.
function resolveBaseURL() {
  if (typeof window === 'undefined') {
    return env.PUBLIC_SERVER_URL || 'http://localhost:3002';
  }
  if (env.PUBLIC_IS_SELFHOSTED === 'true' || dev) {
    return env.PUBLIC_SERVER_URL || `${window.location.origin}/api/auth`;
  }
  return `${window.location.origin}/proxy/api/auth`;
}

const baseURL = resolveBaseURL();

export const authClient = createAuthClient({
  baseURL,
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
