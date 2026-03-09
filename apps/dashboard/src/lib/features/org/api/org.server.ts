import { classroomio } from '$lib/utils/services/api';

/**
 * Server-side organization API functions.
 * These are stateless functions (not a class with $state) to avoid cross-request
 * data leakage in SSR. Each call is independent.
 *
 * Use these in +layout.server.ts, +server.ts, and other server-side files.
 * For client-side usage, use orgApi from './org.svelte' instead.
 */

/**
 * Gets the first organization (for self-hosted single-org mode)
 * @param apiKeyHeaders API key headers for server-side authentication
 * @returns First organization or null
 */
export async function getFirstOrg(apiKeyHeaders: { headers: Record<string, string> }) {
  try {
    const response = await classroomio.organization.first.$get(undefined, apiKeyHeaders);
    const data = await response.json();
    return data.success && data.data && data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching first organization (server):', error);
    return null;
  }
}

/**
 * Gets organization by siteName (server-side)
 * @param siteName Organization site name
 * @param apiKeyHeaders API key headers for server-side authentication
 * @returns Organization or null
 */
export async function getOrgBySiteName(siteName: string, apiKeyHeaders: { headers: Record<string, string> }) {
  try {
    const response = await classroomio.organization.$get(
      {
        query: { siteName }
      },
      apiKeyHeaders
    );

    const data = await response.json();
    return data.success && data.data && data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching organization by siteName (server):', error);
    return null;
  }
}

/**
 * Gets organizations by custom domain (server-side)
 * @param customDomain Custom domain
 * @param isCustomDomainVerified Whether the domain is verified
 * @param apiKeyHeaders API key headers for server-side authentication
 * @returns Array of organizations
 */
export async function getOrgsByCustomDomain(
  customDomain: string,
  isCustomDomainVerified: boolean,
  apiKeyHeaders: { headers: Record<string, string> }
) {
  try {
    const response = await classroomio.organization.$get(
      {
        query: {
          customDomain,
          isCustomDomainVerified
        }
      },
      apiKeyHeaders
    );

    const data = await response.json();
    return data.success && data.data ? data.data : [];
  } catch (error) {
    console.error('Error fetching organizations by custom domain (server):', error);
    return [];
  }
}
