import { env } from '$env/dynamic/private';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

const getApiBaseUrl = () => (env.PRIVATE_SERVER_URL || env.PUBLIC_SERVER_URL || '').replace(/\/$/, '');

export type LicenseFeatures = {
  valid: boolean;
  features: string[];
  expiresAt?: string;
};

/**
 * Fetches license features from the API (server-side only).
 * Returns empty features on failure so the app continues to work.
 */
export async function getLicenseFeatures(): Promise<LicenseFeatures> {
  try {
    const base = getApiBaseUrl();
    if (!base) return { valid: false, features: [] };

    const { headers } = getApiKeyHeaders();
    const response = await fetch(`${base}/license/features`, {
      method: 'GET',
      headers: { ...headers, Accept: 'application/json' }
    });

    const data = await response.json();
    if (!data.success || !data.data) return { valid: false, features: [] };

    return {
      valid: !!data.data.valid,
      features: Array.isArray(data.data.features) ? data.data.features : [],
      expiresAt: data.data.expiresAt
    };
  } catch {
    return { valid: false, features: [] };
  }
}
