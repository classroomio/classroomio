import type { Context, Next } from 'hono';
import { isFeatureLicensed } from '@api/services/license';
import type { LicenseFeatureId } from '@cio/utils/license';

/**
 * Middleware that returns 403 if the given feature is not licensed.
 * Use for routes that require a license key (SSO, token-auth, etc.).
 */
export function requireLicense(feature: LicenseFeatureId | string) {
  return async (c: Context, next: Next) => {
    const licensed = await isFeatureLicensed(feature);
    if (!licensed) {
      return c.json(
        {
          success: false,
          error: 'FEATURE_REQUIRES_LICENSE',
          message: `This feature requires a valid license. Please add a license key and configure LICENSE_VERIFICATION_URL.`
        },
        403
      );
    }
    await next();
  };
}
