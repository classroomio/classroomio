import { env } from '@api/config/env';
import { LICENSE_FEATURE, type LicenseFeatureId } from '@cio/utils/license';

export type LicenseStatus = {
  valid: boolean;
  features: string[];
  expiresAt?: string;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedStatus: LicenseStatus | null = null;
let cacheExpiry = 0;

/** All available license features for non-self-hosted (cloud/SaaS) instances */
const ALL_FEATURES = Object.values(LICENSE_FEATURE);

/** Check if running in self-hosted mode */
function isSelfHosted(): boolean {
  return env.PUBLIC_IS_SELFHOSTED === 'true';
}

/**
 * Calls the external license verification API.
 * or body: { licenseKey: string }.
 * Expected response: { valid: boolean, features?: string[], expiresAt?: string }
 */
async function fetchLicenseFromApi(): Promise<LicenseStatus> {
  const url = 'https://enterprise-api.classroomio.dev';
  const key = env.LICENSE_KEY?.trim();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ licenseKey: key })
    });

    if (!response.ok) {
      console.error('License API error:', response.status, await response.text());
      return { valid: false, features: [] };
    }

    const data = (await response.json()) as { valid?: boolean; features?: string[]; expiresAt?: string };
    return {
      valid: !!data.valid,
      features: Array.isArray(data.features) ? data.features : [],
      expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : undefined
    };
  } catch (error) {
    console.error('License verification failed:', error);
    return { valid: false, features: [] };
  }
}

/**
 * Gets the current license status. Uses in-memory cache (1 hour TTL).
 * For non-self-hosted (cloud/SaaS), returns all features as valid.
 */
export async function getLicenseStatus(): Promise<LicenseStatus> {
  const now = Date.now();
  if (cachedStatus !== null && now < cacheExpiry) {
    return cachedStatus;
  }

  // Cloud/SaaS has no license restrictions - all features enabled
  if (!isSelfHosted()) {
    const status: LicenseStatus = { valid: true, features: ALL_FEATURES };
    cachedStatus = status;
    cacheExpiry = now + CACHE_TTL_MS;
    return status;
  }

  const status = await fetchLicenseFromApi();
  cachedStatus = status;
  cacheExpiry = now + CACHE_TTL_MS;
  return status;
}

/**
 * Checks if a specific feature is licensed.
 * @param feature - Feature ID from LICENSE_FEATURE
 * Non-self-hosted (cloud/SaaS) instances have all features enabled.
 */
export async function isFeatureLicensed(feature: LicenseFeatureId | string): Promise<boolean> {
  // Cloud/SaaS has no license restrictions
  if (!isSelfHosted()) {
    return true;
  }
  const status = await getLicenseStatus();
  if (!status.valid) return false;
  return status.features.includes(feature);
}

/**
 * Checks if the given feature is licensed. Synchronous version using cached status.
 * Returns false if cache is cold (first call will populate async).
 * Use getLicenseStatus() or isFeatureLicensed() for accurate checks.
 * Non-self-hosted (cloud/SaaS) instances have all features enabled.
 */
export function isFeatureLicensedSync(feature: LicenseFeatureId | string): boolean {
  // Cloud/SaaS has no license restrictions
  if (!isSelfHosted()) {
    return true;
  }

  if (cachedStatus === null || !cachedStatus.valid) return false;

  return cachedStatus.features.includes(feature);
}
