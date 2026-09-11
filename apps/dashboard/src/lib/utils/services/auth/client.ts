import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { ssoClient } from '@better-auth/sso/client';
import { dev } from '$app/environment';

// Browser baseURL depends on deployment shape:
//
//   - Self-hosted: browser auth calls stay on the dashboard origin at
//     `/api/auth/*`; hooks.server.ts forwards them to the API over
//     PRIVATE_SERVER_URL.
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
function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function resolveBaseURL() {
  if (typeof window === 'undefined') {
    return env.PUBLIC_SERVER_URL || 'http://localhost:3002';
  }
  if (dev) {
    // When accessed from mobile or a LAN network host (e.g. 192.168.x.x),
    // the remote client cannot reach localhost:3002. Furthermore, calling
    // localhost:3002 would set cookies on localhost rather than the current origin.
    // Always use the same-origin proxy for non-localhost hosts.
    if (!isLocalhost(window.location.hostname)) {
      return `${window.location.origin}/api/auth`;
    }
    return env.PUBLIC_SERVER_URL || `${window.location.origin}/api/auth`;
  }
  if (env.PUBLIC_IS_SELFHOSTED === 'true') {
    return `${window.location.origin}/api/auth`;
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
