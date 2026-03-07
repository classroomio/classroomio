/**
 * License-gated feature identifiers.
 * Add new features here to make them require a license key.
 *
 * Expected from external license API response: { valid: boolean, features: string[] }
 */
export const LICENSE_FEATURE = {
  SSO: 'sso',
  TOKEN_AUTH: 'token-auth',
  NO_TRACKING: 'no-tracking',
  CUSTOM_DOMAIN: 'custom-domain',
  CUSTOM_BRANDING: 'custom-branding'
} as const;

export type LicenseFeatureId = (typeof LICENSE_FEATURE)[keyof typeof LICENSE_FEATURE];

/** All known license feature IDs for validation */
export const LICENSE_FEATURE_IDS = Object.values(LICENSE_FEATURE) as readonly string[];
