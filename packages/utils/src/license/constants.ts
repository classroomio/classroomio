/**
 * License-gated feature identifiers.
 * Add new features here to make them require a license key.
 *
 * Expected from external license API response: { valid: boolean, features: string[] }
 */
export const LICENSE_FEATURE = {
  /** SSO (OIDC/SAML) - organization single sign-on */
  SSO: 'sso',
  /** Token-based authentication (API keys for programmatic access) */
  TOKEN_AUTH: 'token-auth',
  /**
   * Disable tracking: hide PostHog, Senja, and other external analytics/marketing.
   * When licensed, these tools are not loaded.
   */
  NO_TRACKING: 'no-tracking',
  /** Custom domains (typically already gated by plan; add if license should override) */
  CUSTOM_DOMAIN: 'custom-domain',
  /** Add more enterprise features as needed */
  CUSTOM_BRANDING: 'custom-branding'
} as const;

export type LicenseFeatureId = (typeof LICENSE_FEATURE)[keyof typeof LICENSE_FEATURE];

/** All known license feature IDs for validation */
export const LICENSE_FEATURE_IDS = Object.values(LICENSE_FEATURE) as readonly string[];
