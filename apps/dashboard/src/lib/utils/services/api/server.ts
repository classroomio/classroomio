import { env } from '$env/dynamic/private';

/**
 * Server-side helper to get API key headers for RPC client calls
 * Use this in server-side files (+layout.server.ts, +page.server.ts, +server.ts)
 * when making API calls that don't have user session cookies
 *
 * @returns Headers object with Authorization Bearer token
 *
 * @example
 * ```typescript
 * const response = await classroomio.organization.$get(
 *   { query: { siteName } },
 *   getApiKeyHeaders()
 * );
 * ```
 */
export function getApiKeyHeaders(): { headers: { Authorization: string } } {
  if (!env.PRIVATE_SERVER_KEY) {
    throw new Error('PRIVATE_SERVER_KEY is not configured in environment variables');
  }

  return {
    headers: {
      Authorization: `Bearer ${env.PRIVATE_SERVER_KEY}`
    }
  };
}
