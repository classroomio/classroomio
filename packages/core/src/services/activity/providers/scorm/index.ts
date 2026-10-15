import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getActivityById, updateActivity } from '@cio/db/queries/activity';
import { deleteAssetUsagesByTarget, createAssetUsage, getAssetById } from '@cio/db/queries/assets';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { transferScormPackageAsset } from '../../../assets/asset-transfer';
import { getCurrentPackageVersion, listPackageVersionsByAsset } from '@cio/db/queries/activity/package-version';
import { listPackageUnitsByVersion } from '@cio/db/queries/activity/package-unit';
import { getActivityScormByActivityId, upsertActivityScorm } from '@cio/db/queries/scorm';
import { closeOpenAttemptsForActivity, getActivityOpenAttemptCounts } from '@cio/db/queries/scorm/attempt';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import { LICENSE_FEATURE } from '@cio/utils/license';
import { ACTIVITY_PACKAGE_SLOT } from '@cio/utils/validation/assets/assets';
import { ZScormSettings } from '@cio/utils/validation/activity/scorm';
import { getScormModuleProgress, launchScormActivity } from './launch';
import {
  getComplianceSnapshot as fetchComplianceSnapshot,
  getLearnerDetail as fetchLearnerDetail,
  getResultsSummary as fetchResultsSummary,
  listLearnerSummaries as fetchLearnerSummaries,
  resetScormLearner
} from './results';
import type { TScormResultsQuery } from '@cio/utils/validation/activity/report';
import type {
  ActivityComplianceSnapshot,
  ActivityCopySource,
  ActivityCopyTarget,
  ActivityEditorData,
  ActivityLearnerDetail,
  ActivityLearnerSummary,
  ActivityLaunchContext,
  ActivityLaunchResult,
  ActivityProgressContext,
  ActivityProvider,
  ActivityResultsSummary,
  GoLiveBlocker,
  ScormLaunchModule
} from '../types';

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

/**
 * Attaches a processed org package to an activity, replacing any previous
 * attachment. Pointing at a different package closes open attempts pinned
 * to the old one: they can never resume, so they must not linger as
 * in-progress. Re-attaching the attached package does nothing. Throws when
 * the asset is missing, foreign, has no ready current version, or is
 * byte-identical to the attached package.
 */
export async function attachScormPackage(
  activityId: string,
  assetId: string,
  organizationId: string,
  userId: string
): Promise<{ title?: string }> {
  const asset = await getAssetById(assetId, organizationId);
  if (!asset || asset.kind !== 'scorm') throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);

  const current = await getCurrentPackageVersion(asset.id);
  if (!current || current.status !== 'ready')
    throw new AppError('Package has no ready version yet', ErrorCodes.VALIDATION_ERROR, 400);

  return db.transaction(async (tx) => {
    const previous = await getActivityScormByActivityId(activityId, tx);
    if (previous?.assetId === asset.id) return {};

    const previousCurrent = previous?.assetId ? await getCurrentPackageVersion(previous.assetId, tx) : null;
    if (previousCurrent?.contentSha256 && previousCurrent.contentSha256 === current.contentSha256) {
      throw new AppError('This package is identical to the attached one', ErrorCodes.CONFLICT, 409);
    }

    const sequenced = ((current.warnings ?? []) as string[]).includes('has_sequencing');

    await upsertActivityScorm({ activityId, assetId: asset.id, moduleOrder: sequenced ? 'sequential' : 'free' }, tx);
    if (previous?.assetId && previous.assetId !== asset.id) {
      await closeOpenAttemptsForActivity(activityId, 'replaced', tx);
    }
    await deleteAssetUsagesByTarget('activity', activityId, tx);
    await createAssetUsage(
      {
        organizationId,
        assetId: asset.id,
        targetType: 'activity',
        targetId: activityId,
        slotType: ACTIVITY_PACKAGE_SLOT,
        createdByProfileId: userId
      },
      tx
    );

    const activity = await getActivityById(activityId, tx);
    let updatedTitle: string | undefined;
    const isUnnamed =
      !activity?.title || activity.title.trim().length === 0 || activity.title.trim().toLowerCase() === 'scorm package';

    if (activity && isUnnamed) {
      const rawTitle = current.title || asset.title;
      const packageTitle = rawTitle ? decodeXmlEntities(rawTitle) : undefined;
      if (packageTitle) {
        await updateActivity(activityId, { title: packageTitle }, tx);
        updatedTitle = packageTitle;
      }
    }

    return { title: updatedTitle ?? activity?.title ?? undefined };
  });
}

/**
 * Detaches the package from an activity. The asset and its versions stay in
 * the Media Manager.
 */
export async function detachScormPackage(activityId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await upsertActivityScorm({ activityId, assetId: null }, tx);
    await deleteAssetUsagesByTarget('activity', activityId, tx);
  });
}

async function resolvePackagePayload(assetId: string) {
  const [versions, currentVersion] = await Promise.all([
    listPackageVersionsByAsset(assetId),
    getCurrentPackageVersion(assetId)
  ]);
  const units = currentVersion ? await listPackageUnitsByVersion(currentVersion.id) : [];

  return { versions, currentVersion, units };
}

export const scormProvider: ActivityProvider = {
  kind: 'scorm',
  licenseFeature: LICENSE_FEATURE.SCORM,
  singleActivityCourse: {
    navLabelKey: 'course.navItems.nav_package',
    courseLabelKey: 'courses.course_card.scorm_course'
  },
  async createDetails(activityId: string, _input: unknown, tx: DbOrTxClient): Promise<void> {
    await upsertActivityScorm({ activityId }, tx);
  },
  async getEditorData(activityId: string): Promise<ActivityEditorData> {
    const details = await getActivityScormByActivityId(activityId);
    if (!details) return { available: false, message: 'Activities are not available yet' };

    const settings = ZScormSettings.parse({
      completionRule: details.completionRule,
      minScorePercent: details.minScorePercent,
      allowRetakes: details.allowRetakes,
      moduleOrder: details.moduleOrder
    });

    if (!details.assetId) {
      return { available: true, kind: 'scorm', settings, package: null };
    }

    const activity = await getActivityById(activityId);
    const organizationId = activity ? await getOrgIdByCourseId(activity.courseId) : null;
    const asset = organizationId ? await getAssetById(details.assetId, organizationId) : null;
    if (!asset) {
      return { available: true, kind: 'scorm', settings, package: null };
    }

    const { versions, currentVersion, units } = await resolvePackagePayload(asset.id);
    const attemptCounts = await getActivityOpenAttemptCounts(
      activityId,
      currentVersion?.id ?? null,
      currentVersion?.assetId ?? asset.id
    );

    return {
      available: true,
      kind: 'scorm',
      settings,
      package: { asset, versions, currentVersion, units, attemptCounts }
    };
  },
  async updateSettings(activityId: string, input: unknown, tx: DbOrTxClient): Promise<void> {
    const parsed = ZScormSettings.safeParse(input);
    if (!parsed.success) throw new AppError('Invalid SCORM settings', ErrorCodes.VALIDATION_ERROR, 400);

    await upsertActivityScorm(
      {
        activityId,
        completionRule: parsed.data.completionRule,
        minScorePercent: parsed.data.minScorePercent ?? null,
        allowRetakes: parsed.data.allowRetakes,
        moduleOrder: parsed.data.moduleOrder
      },
      tx
    );
    await updateActivity(activityId, {}, tx);
  },
  async launch(context: ActivityLaunchContext): Promise<ActivityLaunchResult> {
    return launchScormActivity(context);
  },
  async progress(context: ActivityProgressContext): Promise<ScormLaunchModule[]> {
    return getScormModuleProgress(context);
  },
  async listLearnerSummaries(
    activityId: string,
    profileIds: string[],
    paging?: TScormResultsQuery
  ): Promise<ActivityLearnerSummary[]> {
    const { learners } = await fetchLearnerSummaries(
      activityId,
      profileIds,
      paging ?? {
        page: 1,
        limit: Math.max(profileIds.length, 1),
        sort: 'name',
        direction: 'asc'
      }
    );

    return learners;
  },
  async getResultsSummary(activityId: string, profileIds: string[]): Promise<ActivityResultsSummary> {
    return fetchResultsSummary(activityId, profileIds);
  },
  async getLearnerDetail(activityId: string, profileId: string): Promise<ActivityLearnerDetail> {
    return fetchLearnerDetail(activityId, profileId);
  },
  async resetLearner(activityIds: string[], profileId: string, tx: DbOrTxClient): Promise<number> {
    return resetScormLearner(activityIds, profileId, tx);
  },
  async copy(source: ActivityCopySource, target: ActivityCopyTarget, tx: DbOrTxClient): Promise<void> {
    const details = await getActivityScormByActivityId(source.activityId, tx);
    if (!details) return;

    if (!details.assetId || source.organizationId === target.organizationId || !target.organizationId) {
      await upsertActivityScorm(
        {
          activityId: target.activityId,
          assetId: details.assetId,
          completionRule: details.completionRule,
          minScorePercent: details.minScorePercent,
          allowRetakes: details.allowRetakes,
          moduleOrder: details.moduleOrder
        },
        tx
      );

      if (details.assetId && target.organizationId) {
        await createAssetUsage(
          {
            organizationId: target.organizationId,
            assetId: details.assetId,
            targetType: 'activity',
            targetId: target.activityId,
            slotType: ACTIVITY_PACKAGE_SLOT,
            createdByProfileId: target.userId
          },
          tx
        );
      }

      return;
    }

    const asset = await getAssetById(details.assetId, source.organizationId ?? undefined);
    if (!asset) throw new AppError('Package not found', ErrorCodes.NOT_FOUND, 404);

    const transfer = await transferScormPackageAsset(asset, target.organizationId, target.userId, tx);

    await upsertActivityScorm(
      {
        activityId: target.activityId,
        assetId: transfer.asset.id,
        completionRule: details.completionRule,
        minScorePercent: details.minScorePercent,
        allowRetakes: details.allowRetakes,
        moduleOrder: details.moduleOrder
      },
      tx
    );

    await createAssetUsage(
      {
        organizationId: target.organizationId,
        assetId: transfer.asset.id,
        targetType: 'activity',
        targetId: target.activityId,
        slotType: ACTIVITY_PACKAGE_SLOT,
        createdByProfileId: target.userId
      },
      tx
    );
  },
  async delete(activityId: string, tx: DbOrTxClient): Promise<void> {
    await deleteAssetUsagesByTarget('activity', activityId, tx);
  },
  async goLiveBlockers(activityId: string): Promise<GoLiveBlocker[]> {
    const details = await getActivityScormByActivityId(activityId);
    if (!details?.assetId) {
      return [
        {
          code: 'ACTIVITY_NOT_READY',
          message: 'Add a SCORM package before going live.',
          target: `activity:${activityId}`
        }
      ];
    }

    const current = await getCurrentPackageVersion(details.assetId);
    if (!current || current.status !== 'ready') {
      return [
        {
          code: 'ACTIVITY_NOT_READY',
          message: 'The SCORM package is still processing.',
          target: `activity:${activityId}`
        }
      ];
    }

    return [];
  },
  async complianceSnapshot(activityId: string, profileId: string): Promise<ActivityComplianceSnapshot | null> {
    return fetchComplianceSnapshot(activityId, profileId);
  }
};
