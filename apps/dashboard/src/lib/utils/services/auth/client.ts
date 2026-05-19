import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { ssoClient } from '@better-auth/sso/client';

// Browser: same-origin `/api` via the Cloudflare Worker, so auth cookies
// stay host-only on whichever domain the user is currently on
// (app.classroomio.com, <org>.classroomio.school, or a BYOD domain).
// SSR: `authClient`'s methods aren't called server-side — the dashboard uses
// `authServerClient` for that — but Better Auth's constructor still validates
// the baseURL with `new URL(...)`, so we hand it the public API URL as a
// placeholder. PRIVATE_SERVER_URL is deliberately not used here: it's the
// internal Render hostname, never reachable from a browser.
const baseURL =
  typeof window !== 'undefined' ? `${window.location.origin}/api` : env.PUBLIC_SERVER_URL || 'http://localhost:3002';

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
