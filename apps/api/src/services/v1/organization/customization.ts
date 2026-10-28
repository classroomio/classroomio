import type { TPublicApiUpdateOrganizationCustomization } from '@cio/utils/validation/public-api';

import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  getActiveOrganizationPlan,
  getOrganizationById,
  lockOrganizationForUpdate
} from '@cio/db/queries/organization';
import { DEFAULT_ORG_CUSTOMIZATION } from '@cio/utils/constants';
import { canUseBasicAuthSettings } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';
import { updateOrg } from '@api/services/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertOrgAdmin } from '../shared';

type TCustomization = typeof DEFAULT_ORG_CUSTOMIZATION;

/** Fills in the keys the organization never saved, the same way the dashboard does when it loads the org. */
function withDefaults(stored: unknown): TCustomization {
  const saved = (stored ?? {}) as Partial<TCustomization>;

  return {
    ...saved,
    dashboard: { ...DEFAULT_ORG_CUSTOMIZATION.dashboard, ...saved.dashboard },
    course: { ...DEFAULT_ORG_CUSTOMIZATION.course, ...saved.course },
    apps: { ...DEFAULT_ORG_CUSTOMIZATION.apps, ...saved.apps },
    auth: { ...DEFAULT_ORG_CUSTOMIZATION.auth, ...saved.auth }
  };
}

function toPublicCustomization({ dashboard, course, apps, auth }: TCustomization) {
  return {
    dashboard: {
      community: dashboard.community,
      exercise: dashboard.exercise,
      bannerImage: dashboard.bannerImage || null,
      bannerText: dashboard.bannerText
    },
    course: { newsfeed: course.newsfeed, grading: course.grading },
    apps: { comments: apps.comments },
    auth: { backgroundImage: auth.backgroundImage || null }
  };
}

async function getStoredCustomization(orgId: string, dbClient: DbOrTxClient = db) {
  const organization = await getOrganizationById(orgId, dbClient);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  return withDefaults(organization.customization);
}

/** The dashboard locks the login background on the free plan; this is the server-side twin. */
async function assertLoginBackgroundEntitlement(orgId: string) {
  const activePlan = await getActiveOrganizationPlan(orgId);

  if (!canUseBasicAuthSettings(activePlan?.planName, env.PUBLIC_IS_SELFHOSTED === 'true')) {
    throw new AppError('A login background image requires a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403);
  }
}

export async function getPublicApiOrganizationCustomizationService(orgId: string, actorId: string | null) {
  await assertOrgAdmin(orgId, actorId);

  return toPublicCustomization(await getStoredCustomization(orgId));
}

/**
 * `updateOrg` replaces the whole customization JSON, so the patch is merged into the stored value under a row
 * lock, and concurrent PATCHes can't undo each other. A null image is stored as '', which is how the dashboard clears it.
 */
export async function updatePublicApiOrganizationCustomizationService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiUpdateOrganizationCustomization
) {
  await assertOrgAdmin(orgId, actorId);

  const backgroundImage = payload.auth?.backgroundImage;
  if (backgroundImage) {
    await assertLoginBackgroundEntitlement(orgId);
  }

  const { bannerImage, ...dashboard } = payload.dashboard ?? {};

  const organization = await db.transaction(async (tx) => {
    await lockOrganizationForUpdate(orgId, tx);
    const current = await getStoredCustomization(orgId, tx);

    const customization: TCustomization = {
      ...current,
      dashboard: {
        ...current.dashboard,
        ...dashboard,
        ...(bannerImage !== undefined && { bannerImage: bannerImage ?? '' })
      },
      course: { ...current.course, ...payload.course },
      apps: { ...current.apps, ...payload.apps },
      auth: backgroundImage === undefined ? current.auth : { ...current.auth, backgroundImage: backgroundImage ?? '' }
    };

    return updateOrg(orgId, { customization }, tx);
  });

  return toPublicCustomization(withDefaults(organization.customization));
}
