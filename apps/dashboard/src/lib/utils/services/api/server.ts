import { env } from '$env/dynamic/private';
import { ApiError } from './types';

export type ServerApiResult<T> = { ok: true; status: number; body: T } | { ok: false; status: number; message: string };

function getServerApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown server API error';
}

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

/**
 * Wrap server-side API calls so SSR loaders can degrade gracefully instead of throwing.
 */
export async function safeServerApi<T>(requestFn: () => Promise<Response>): Promise<ServerApiResult<T>> {
  try {
    const response = await requestFn();
    const result = (await response.json()) as unknown;

    if (typeof result === 'object' && result !== null && 'success' in result) {
      if ((result as { success: boolean }).success === true) {
        return {
          ok: true,
          status: response.status,
          body: result as T
        };
      }

      const errorResult = result as { error?: string; message?: string } | null;

      return {
        ok: false,
        status: response.status,
        message: errorResult?.error ?? errorResult?.message ?? response.statusText
      };
    }

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        body: result as T
      };
    }

    return {
      ok: false,
      status: response.status,
      message: response.statusText || 'Unexpected server API response'
    };
  } catch (error) {
    return {
      ok: false,
      status: error instanceof ApiError ? (error.status ?? 0) : 0,
      message: getServerApiErrorMessage(error)
    };
  }
}
