import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getActivityScormByActivityId } from '@cio/db/queries/scorm';
import { getCurrentPackageVersion, getPackageVersionById } from '@cio/db/queries/activity/package-version';
import { listPackageUnitsByVersion } from '@cio/db/queries/activity/package-unit';
import {
  createScormAttempt,
  getLatestScormAttempt,
  getOpenScormAttempt,
  lockScormAttemptForUpdate
} from '@cio/db/queries/scorm/attempt';
import { createScoAttempt, getOpenScoAttempt, listLatestScoAttemptsByAttempt } from '@cio/db/queries/scorm/sco-attempt';
import { getCourseById } from '@cio/db/queries/course/course';
import { getLatestComplianceRecordsByProfiles } from '@cio/db/queries/course/compliance';
import { getOrganizationById } from '@cio/db/queries/organization/organization';
import {
  LAUNCH_TOKEN_TTL_SECONDS,
  mintContentToken,
  mintLaunchToken,
  moduleOutcomeFromCmi,
  type LaunchMode,
  type ScormCompletionRule,
  type ScormModuleOutcome,
  type ScormPackageFormat,
  type ScormPackageUnit,
  type ScormRuleSettings
} from '@cio/activity-packages';
import { AppError, ErrorCodes, isUniqueConstraintViolation } from '@cio/utils/errors';
import { TENANT_ROOT_DOMAIN } from '@cio/utils/constants/domains';
import { ZScormSettings } from '@cio/utils/validation/activity/scorm';
import type { TActivityScorm, TContentPackageUnit, TScormAttempt, TScormScoAttempt } from '@cio/db/types';

import {
  getActivitySigningSecret,
  getScormContentDomain,
  getScormContentOrigin,
  orgContentKey
} from '../../../../config/activity-content';
import { getAppBaseUrl, getDashboardBaseUrl } from '../../../../config/dashboard-url';
import { env } from '../../../../config/env';
import type { ActivityLaunchContext, ActivityLaunchResult, ScormLaunchModule, ScormLaunchUnit } from '../types';

const NOT_AVAILABLE_MESSAGE = "This package isn't available yet";

export function toRuleSettings(details: TActivityScorm): ScormRuleSettings {
  const parsed = ZScormSettings.parse({
    completionRule: details.completionRule,
    minScorePercent: details.minScorePercent,
    allowRetakes: details.allowRetakes,
    launchMode: details.launchMode
  });

  return { rule: parsed.completionRule, minScorePercent: parsed.minScorePercent };
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

/**
 * Adapts a package unit row to the outcome helper's unit shape. Unit pass
 * marks arrive from numeric columns as strings.
 */
export function toOutcomeUnit(
  row: TContentPackageUnit
): Pick<ScormPackageUnit, 'masteryScoreRaw' | 'passingScoreScaled' | 'completionThreshold'> {
  return {
    masteryScoreRaw: toNumberOrNull(row.masteryScoreRaw),
    passingScoreScaled: toNumberOrNull(row.passingScoreScaled),
    completionThreshold: toNumberOrNull(row.completionThreshold)
  };
}

export function playerFormat(format: string | null): 'scorm12' | 'scorm2004' {
  return format === 'scorm12' ? 'scorm12' : 'scorm2004';
}

export function packageFormat(format: string | null): ScormPackageFormat {
  if (format === 'scorm12' || format === 'scorm2004_2' || format === 'scorm2004_3' || format === 'scorm2004_4') {
    return format;
  }

  return 'scorm12';
}

function isTickMet(rule: ScormCompletionRule, outcome: ScormModuleOutcome): boolean {
  if (rule === 'completed') return outcome.completion === 'completed';
  if (rule === 'passed') return outcome.success === 'passed';
  if (rule === 'score') return outcome.completion === 'completed';

  const isGraded = outcome.hasPassMark || outcome.success !== 'unknown';
  if (isGraded) return outcome.success === 'passed';

  return outcome.completion === 'completed';
}

function outcomeOf(
  unit: TContentPackageUnit,
  latestTry: TScormScoAttempt | null,
  format: ScormPackageFormat
): ScormModuleOutcome {
  if (!latestTry) return { completion: 'not_attempted', success: 'unknown', hasPassMark: false, scaledScore: null };

  return moduleOutcomeFromCmi((latestTry.cmi ?? {}) as Record<string, unknown>, format, toOutcomeUnit(unit));
}

/**
 * Returns one outcome per launchable module, in manifest order, from the
 * attempt's latest try per module.
 */
export function attemptModuleOutcomes(
  units: TContentPackageUnit[],
  triesByUnit: Map<string, TScormScoAttempt>,
  format: ScormPackageFormat
): ScormModuleOutcome[] {
  return launchableUnits(units).map((unit) => outcomeOf(unit, triesByUnit.get(unit.id) ?? null, format));
}

function toLaunchModule(
  unit: TContentPackageUnit,
  latestTry: TScormScoAttempt | null,
  settings: ScormRuleSettings,
  format: ScormPackageFormat
): ScormLaunchModule {
  const outcome = outcomeOf(unit, latestTry, format);
  const scaled = outcome.scaledScore;

  return {
    identifier: unit.identifier,
    title: unit.title,
    position: unit.position,
    completed: latestTry ? isTickMet(settings.rule, outcome) : false,
    scorePercent: scaled === null ? null : Math.round(scaled * 100),
    status: latestTry ? (latestTry.status as ScormLaunchModule['status']) : 'not_attempted'
  };
}

function launchableUnits(units: TContentPackageUnit[]): TContentPackageUnit[] {
  return units.filter((unit) => unit.unitType === 'sco').sort((left, right) => left.position - right.position);
}

function toLaunchUnit(unit: TContentPackageUnit): ScormLaunchUnit {
  return { identifier: unit.identifier, title: unit.title, href: unit.href, position: unit.position };
}

function launchModeOf(details: TActivityScorm): 'embedded' | 'window' {
  return details.launchMode === 'window' ? 'window' : 'embedded';
}

interface LaunchHosts {
  ancestors: string[];
  contentHost: string;
  orgKey: string;
}

/**
 * Resolves every origin the activity page can be served from, plus the
 * content host the player loads from.
 */
export async function resolveLaunchHosts(organizationId: string): Promise<LaunchHosts> {
  const organization = await getOrganizationById(organizationId);
  if (!organization) throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);

  const ancestors = [
    ...(organization.siteName ? [`https://${organization.siteName}.${TENANT_ROOT_DOMAIN}`] : []),
    ...(organization.customDomain && organization.isCustomDomainVerified
      ? [`https://${organization.customDomain}`]
      : []),
    getAppBaseUrl(),
    getDashboardBaseUrl({
      siteName: organization.siteName,
      customDomain: organization.customDomain,
      isCustomDomainVerified: organization.isCustomDomainVerified
    })
  ];

  const seen = new Set<string>();
  const uniqueAncestors = ancestors.filter((origin) => {
    if (seen.has(origin)) return false;
    seen.add(origin);
    return true;
  });

  const orgKey = orgContentKey(organization.id);
  const contentHost =
    env.PUBLIC_IS_SELFHOSTED === 'true' || env.NODE_ENV === 'development'
      ? getScormContentOrigin()
      : `https://${orgKey}.${getScormContentDomain()}`;

  return { ancestors: uniqueAncestors, contentHost, orgKey };
}

async function hasComplianceCycleStartedSince(
  courseId: string,
  profileId: string,
  latestClosedAt: string | null,
  dbClient: DbOrTxClient
): Promise<boolean> {
  if (!latestClosedAt) return false;

  const [course] = await getCourseById(courseId, dbClient);
  if (!course || course.type !== 'COMPLIANCE') return false;

  const [record] = await getLatestComplianceRecordsByProfiles(courseId, [profileId], dbClient);
  if (!record) return false;

  return record.createdAt > latestClosedAt;
}

interface AttemptResolution {
  attempt: TScormAttempt;
  review: boolean;
}

async function resolveAttempt(
  activityId: string,
  courseId: string,
  profileId: string,
  versionId: string,
  allowRetakes: boolean,
  startNewAttempt: boolean,
  tx: DbOrTxClient
): Promise<AttemptResolution> {
  const open = await getOpenScormAttempt(activityId, profileId, tx);
  if (open) {
    const locked = await lockScormAttemptForUpdate(open.id, tx);

    return { attempt: locked ?? open, review: false };
  }

  const latest = await getLatestScormAttempt(activityId, profileId, tx);
  const attemptNumber = (latest?.attemptNumber ?? 0) + 1;
  const closedAt = latest?.closedAt ?? null;

  const shouldCreate =
    !latest ||
    latest.closeReason === 'replaced' ||
    (startNewAttempt && allowRetakes) ||
    (await hasComplianceCycleStartedSince(courseId, profileId, closedAt ?? latest?.startedAt ?? null, tx));

  if (!shouldCreate && latest) return { attempt: latest, review: true };

  try {
    const created = await createScormAttempt({ activityId, profileId, packageVersionId: versionId, attemptNumber }, tx);

    return { attempt: created, review: false };
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) throw error;

    const raced = await getOpenScormAttempt(activityId, profileId, tx);
    if (!raced) throw error;

    return { attempt: raced, review: false };
  }
}

async function resolveTry(attemptId: string, unitId: string, tx: DbOrTxClient): Promise<TScormScoAttempt> {
  const open = await getOpenScoAttempt(attemptId, unitId, tx);
  if (open) return open;

  try {
    return await createScoAttempt({ attemptId, unitId }, tx);
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) throw error;

    const raced = await getOpenScoAttempt(attemptId, unitId, tx);
    if (!raced) throw error;

    return raced;
  }
}

async function latestTriesByUnit(
  attemptId: string,
  dbClient: DbOrTxClient = db
): Promise<Map<string, TScormScoAttempt>> {
  const latest = await listLatestScoAttemptsByAttempt(attemptId, dbClient);
  const byUnit = new Map<string, TScormScoAttempt>();

  for (const row of latest) byUnit.set(row.unitId, row);

  return byUnit;
}

function pickUnit(
  units: TContentPackageUnit[],
  unitIdentifier: string | undefined,
  tries: Map<string, TScormScoAttempt>,
  settings: ScormRuleSettings,
  format: ScormPackageFormat
): TContentPackageUnit {
  const launchable = launchableUnits(units);

  if (unitIdentifier) {
    const chosen = launchable.find((unit) => unit.identifier === unitIdentifier);
    if (!chosen) throw new AppError('Module not found', ErrorCodes.NOT_FOUND, 404);

    return chosen;
  }

  const firstIncomplete = launchable.find((unit) => {
    const outcome = outcomeOf(unit, tries.get(unit.id) ?? null, format);

    return !isTickMet(settings.rule, outcome);
  });

  const fallback = launchable[0];
  if (!fallback) throw new AppError('Package has no launchable modules', ErrorCodes.VALIDATION_ERROR, 400);

  return firstIncomplete ?? fallback;
}

interface LaunchedModule {
  attempt: TScormAttempt;
  versionId: string;
  format: ScormPackageFormat;
  unit: TContentPackageUnit;
  scoAttempt: TScormScoAttempt | null;
  review: boolean;
  reviewOfArchivedVersion: boolean;
}

/**
 * Resolves what a launch opens: one module try, its tokens and the module
 * menu. Team previews open without writing learner state. Never writes
 * completion; commits do that.
 */
export async function launchScormActivity(context: ActivityLaunchContext): Promise<ActivityLaunchResult> {
  const details = await getActivityScormByActivityId(context.activityId);
  if (!details) return { available: false, message: NOT_AVAILABLE_MESSAGE };

  const settings = toRuleSettings(details);
  const secret = getActivitySigningSecret();
  if (!secret) throw new AppError('Activity launch not configured', ErrorCodes.INTERNAL_ERROR, 503);

  const hosts = await resolveLaunchHosts(context.organizationId);

  if (!details.assetId) return { available: false, message: NOT_AVAILABLE_MESSAGE };

  const current = await getCurrentPackageVersion(details.assetId);
  if (!current || current.status !== 'ready') return { available: false, message: NOT_AVAILABLE_MESSAGE };

  const currentUnits = await listPackageUnitsByVersion(current.id);
  if (launchableUnits(currentUnits).length === 0) return { available: false, message: NOT_AVAILABLE_MESSAGE };

  const expiresAt = new Date(Date.now() + LAUNCH_TOKEN_TTL_SECONDS * 1000).toISOString();

  if (context.isPreview) {
    const units = launchableUnits(currentUnits);
    const unit = context.unitIdentifier
      ? (units.find((candidate) => candidate.identifier === context.unitIdentifier) ?? null)
      : units[0];
    if (!unit) throw new AppError('Module not found', ErrorCodes.NOT_FOUND, 404);

    const launchToken = await mintLaunchToken(
      {
        org: hosts.orgKey,
        act: context.activityId,
        sub: context.profileId,
        unit: unit.id,
        fmt: current.format ?? 'scorm12',
        mode: 'preview',
        anc: hosts.ancestors
      },
      secret
    );

    const modules = units.map((candidate) => ({
      identifier: candidate.identifier,
      title: candidate.title,
      position: candidate.position,
      completed: false,
      scorePercent: null,
      status: 'not_attempted' as const
    }));

    const playerUrl = `${hosts.contentHost}/activity/player/${launchToken}`;

    return {
      available: true,
      playerUrl,
      mode: 'preview',
      expiresAt,
      launchMode: launchModeOf(details),
      unit: toLaunchUnit(unit),
      units: modules
    };
  }

  const launched = await db.transaction(async (tx) => {
    const { attempt, review } = await resolveAttempt(
      context.activityId,
      context.courseId,
      context.profileId,
      current.id,
      details.allowRetakes,
      context.newAttempt ?? false,
      tx
    );

    if (review) {
      const reviewVersion = await getPackageVersionById(attempt.packageVersionId, tx);
      if (!reviewVersion) throw new AppError('Package version not found', ErrorCodes.NOT_FOUND, 404);

      if (reviewVersion.status === 'archived') {
        const currentLaunchable = launchableUnits(await listPackageUnitsByVersion(current.id, tx));
        const archivedUnit = context.unitIdentifier
          ? (currentLaunchable.find((candidate) => candidate.identifier === context.unitIdentifier) ??
            currentLaunchable[0])
          : currentLaunchable[0];
        if (!archivedUnit) throw new AppError('Package has no launchable modules', ErrorCodes.VALIDATION_ERROR, 400);

        const launchedArchived: LaunchedModule = {
          attempt,
          versionId: current.id,
          format: packageFormat(current.format),
          unit: archivedUnit,
          scoAttempt: null,
          review: true,
          reviewOfArchivedVersion: true
        };

        return launchedArchived;
      }

      const reviewUnits = launchableUnits(await listPackageUnitsByVersion(reviewVersion.id, tx));
      const reviewUnit = context.unitIdentifier
        ? (reviewUnits.find((candidate) => candidate.identifier === context.unitIdentifier) ?? null)
        : reviewUnits[0];
      if (!reviewUnit) throw new AppError('Module not found', ErrorCodes.NOT_FOUND, 404);

      const launchedReview: LaunchedModule = {
        attempt,
        versionId: reviewVersion.id,
        format: packageFormat(reviewVersion.format),
        unit: reviewUnit,
        scoAttempt: null,
        review: true,
        reviewOfArchivedVersion: false
      };

      return launchedReview;
    }

    const tries = await latestTriesByUnit(attempt.id, tx);
    const format = packageFormat(current.format);
    const unit = pickUnit(
      await listPackageUnitsByVersion(current.id, tx),
      context.unitIdentifier,
      tries,
      settings,
      format
    );
    const scoAttempt = await resolveTry(attempt.id, unit.id, tx);

    const launchedTry: LaunchedModule = {
      attempt,
      versionId: current.id,
      format,
      unit,
      scoAttempt,
      review: false,
      reviewOfArchivedVersion: false
    };

    return launchedTry;
  });

  const triesByUnit = launched.reviewOfArchivedVersion
    ? new Map<string, TScormScoAttempt>()
    : await latestTriesByUnit(launched.attempt.id);
  const menuUnits = launchableUnits(await listPackageUnitsByVersion(launched.versionId));
  const modules = menuUnits.map((unit) =>
    toLaunchModule(unit, triesByUnit.get(unit.id) ?? null, settings, launched.format)
  );

  const mode: LaunchMode = launched.review ? 'review' : 'normal';
  const launchToken = await mintLaunchToken(
    {
      org: hosts.orgKey,
      act: context.activityId,
      ...(launched.scoAttempt ? { att: launched.scoAttempt.id } : {}),
      sub: context.profileId,
      unit: launched.unit.id,
      fmt: launched.format,
      mode,
      anc: hosts.ancestors
    },
    secret
  );

  const playerUrl = `${hosts.contentHost}/activity/player/${launchToken}`;

  return {
    available: true,
    playerUrl,
    mode,
    expiresAt,
    launchMode: launchModeOf(details),
    unit: toLaunchUnit(launched.unit),
    units: modules,
    ...(launched.reviewOfArchivedVersion ? { reviewOfArchivedVersion: true as const } : {})
  };
}
