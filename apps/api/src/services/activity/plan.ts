import { env } from '@cio/core/config/env';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization/organization';
import { ACTIVITY_PROVIDERS } from '@cio/core/services/activity/providers';
import { LICENSE_FEATURE } from '@cio/utils/license';
import { PLAN } from '@cio/utils/plans';
import type { TActivityKind } from '@cio/utils/constants/activity';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { isFeatureLicensed } from '@api/services/license';

/**
 * Throws when the organization may not author activities of the kind.
 * Cloud requires a paid plan; self-hosted requires the provider's license
 * feature. Reads and deletes never call this.
 */
export async function assertActivityKindAllowed(organizationId: string, kind: TActivityKind): Promise<void> {
  const provider = ACTIVITY_PROVIDERS[kind];
  if (!provider) throw new AppError(`Unknown activity kind "${kind}"`, ErrorCodes.VALIDATION_ERROR, 400);

  const licenseFeature = provider.licenseFeature ?? LICENSE_FEATURE.SCORM;

  if (env.PUBLIC_IS_SELFHOSTED === 'true') {
    const licensed = await isFeatureLicensed(licenseFeature);
    if (!licensed)
      throw new AppError('SCORM packages require an enterprise license', ErrorCodes.FEATURE_REQUIRES_LICENSE, 403);

    return;
  }

  const activePlan = await getActiveOrganizationPlan(organizationId);
  if (!activePlan || activePlan.planName === PLAN.BASIC)
    throw new AppError('SCORM packages require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403);
}
