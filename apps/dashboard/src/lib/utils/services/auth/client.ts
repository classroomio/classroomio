import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { ssoClient } from '@better-auth/sso/client';

// Browser: same-origin via the Cloudflare Worker, so auth cookies stay
// host-only on whichever domain the user is on (app.classroomio.com,
// <org>.classroomio.school, or a BYOD domain). The URL is
// `<origin>/proxy/api/auth`:
//   - `/proxy` is the Worker's same-origin escape hatch — it strips
//     that prefix before forwarding to the upstream API.
//   - `/api/auth` is where Better Auth is mounted on the Hono API.
// Better Auth's client treats any baseURL with a path as the auth root
// verbatim (it won't auto-append `/api/auth`), so we encode the full
// downstream path here.
//
// SSR: `authClient` methods are never invoked server-side (the dashboard
// uses `authServerClient` for that), but Better Auth's constructor still
// validates baseURL with `new URL(...)`, so we hand it the public API
// URL as an absolute-URL placeholder.
const baseURL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/proxy/api/auth`
    : env.PUBLIC_SERVER_URL || 'http://localhost:3002';

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
