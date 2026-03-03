import { env } from '$env/dynamic/private';
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

const getApiBaseUrl = () => (env.PRIVATE_SERVER_URL || env.PUBLIC_SERVER_URL || '').replace(/\/$/, '');

/**
 * Server-side API methods for organization operations
 * These methods use API key authentication and should only be used in server-side files
 * (+server.ts, +layout.server.ts) to prevent API keys from being exposed to the client.
 */
export class OrgApiServer {
  /**
   * Gets the first organization (for self-hosted single-org mode)
   * @returns First organization or null
   */
  static async getFirstOrg() {
    try {
      const base = getApiBaseUrl();
      const { headers } = getApiKeyHeaders();
      const response = await fetch(`${base}/organization/first`, {
        method: 'GET',
        headers: { ...headers, Accept: 'application/json' }
      });
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
   * @returns Organization or null
   */
  static async getOrgBySiteName(siteName: string) {
    try {
      const response = await classroomio.organization.$get(
        {
          query: { siteName }
        },
        getApiKeyHeaders()
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
   * @returns Array of organizations
   */
  static async getOrgsByCustomDomain(customDomain: string, isCustomDomainVerified = true) {
    try {
      const response = await classroomio.organization.$get(
        {
          query: {
            customDomain,
            isCustomDomainVerified
          }
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
      console.error('Error fetching organizations by custom domain (server):', error);
      return [];
    }
  }
}
