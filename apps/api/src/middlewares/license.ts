import type { Context, Next } from 'hono';

import type { LicenseFeatureId } from '@cio/utils/license';
import { env } from '@api/config/env';
import { isFeatureLicensed } from '@api/services/license';

/**
 * Middleware that returns 403 if the given feature is not licensed.
 * Use for routes that require a license key (SSO, token-auth, etc.).
 * License check is skipped when not self-hosted (cloud/SaaS has no license restrictions).
 */
export function requireLicense(feature: LicenseFeatureId | string) {
  return async (c: Context, next: Next) => {
    // No license restrictions for cloud/SaaS (non-self-hosted instances)
    const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
    if (!isSelfHosted) {
      await next();
      return;
    }

    const licensed = await isFeatureLicensed(feature);
    if (!licensed) {
      return c.json(
        {
          success: false,
          error: 'FEATURE_REQUIRES_LICENSE',
          message: `This feature requires a valid license. Please add a license key.`
        },
        403
      );
    }
    await next();
  };
}
