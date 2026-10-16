import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getActivityScormByActivityId } from '@cio/db/queries/scorm';
import { getCurrentPackageVersion, getPackageVersionById } from '@cio/db/queries/activity/package-version';
import { listPackageUnitsByVersion } from '@cio/db/queries/activity/package-unit';
import {
  closeScormAttempt,
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
import type {
  TActivityScorm,
  TContentPackageUnit,
  TContentPackageVersion,
  TScormAttempt,
  TScormScoAttempt
} from '@cio/db/types';

import {
  getActivitySigningSecret,
  getScormContentDomain,
  getScormContentOrigin,
  orgContentKey
} from '../../../../config/activity-content';
import { getAppBaseUrl, getDashboardBaseUrl } from '../../../../config/dashboard-url';
import { env } from '../../../../config/env';
import type {
  ActivityLaunchContext,
  ActivityLaunchResult,
  ActivityProgressContext,
  ScormLaunchModule,
  ScormLaunchUnit
} from '../types';

const NOT_AVAILABLE_MESSAGE = "This package isn't available yet";

export function toRuleSettings(details: TActivityScorm): ScormRuleSettings {
  const parsed = ZScormSettings.parse({
    completionRule: details.completionRule,
    minScorePercent: details.minScorePercent,
    allowRetakes: details.allowRetakes,
    completionModules: details.completionModules
  });

  return {
    rule: parsed.completionRule,
    minScorePercent: parsed.minScorePercent,
    completionModules: parsed.completionModules
  };
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
  format: ScormPackageFormat,
  locked: boolean
): ScormLaunchModule {
  const outcome = outcomeOf(unit, latestTry, format);
  const scaled = outcome.scaledScore;

  return {
    identifier: unit.identifier,
    title: unit.title,
    position: unit.position,
    completed: latestTry ? isTickMet(settings.rule, outcome) : false,
    locked,
    scorePercent: scaled === null ? null : Math.round(scaled * 100),
    status: latestTry ? (latestTry.status as ScormLaunchModule['status']) : 'not_attempted',
    success: outcome.success,
    maxTimeAllowed: maxTimeAllowedOf(unit)
  };
}

function launchableUnits(units: TContentPackageUnit[]): TContentPackageUnit[] {
  return units
    .filter((unit) => unit.unitType === 'sco' && unit.isVisible !== false)
    .sort((left, right) => left.position - right.position);
}

function maxTimeAllowedOf(unit: TContentPackageUnit): string | null {
  return 'maxTimeAllowed' in unit.formatDetails ? (unit.formatDetails.maxTimeAllowed ?? null) : null;
}

/**
 * Identifiers past the first module that misses the rule tick, in manifest
 * order. The first gap stays playable; free order never locks.
 */
export function lockedIdentifiers(
  units: TContentPackageUnit[],
  tries: Map<string, TScormScoAttempt>,
  settings: ScormRuleSettings,
  format: ScormPackageFormat,
  sequential: boolean
): Set<string> {
  const locked = new Set<string>();

  if (!sequential) return locked;

  let seenGap = false;

  for (const unit of launchableUnits(units)) {
    if (seenGap) {
      locked.add(unit.identifier);
      continue;
    }

    if (!isTickMet(settings.rule, outcomeOf(unit, tries.get(unit.id) ?? null, format))) seenGap = true;
  }

  return locked;
}

function toLaunchUnit(unit: TContentPackageUnit): ScormLaunchUnit {
  return { identifier: unit.identifier, title: unit.title, href: unit.href, position: unit.position };
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
  restartedAfterReplace: boolean;
}

function isResumableVersion(pinned: TContentPackageVersion | null, current: TContentPackageVersion): boolean {
  return pinned !== null && pinned.status === 'ready' && pinned.assetId === current.assetId;
}

async function resolveAttempt(
  activityId: string,
  courseId: string,
  profileId: string,
  current: TContentPackageVersion,
  allowRetakes: boolean,
  startNewAttempt: boolean,
  tx: DbOrTxClient
): Promise<AttemptResolution> {
  const open = await getOpenScormAttempt(activityId, profileId, tx);
  if (open) {
    const locked = (await lockScormAttemptForUpdate(open.id, tx)) ?? open;
    const pinned =
      locked.packageVersionId === current.id ? current : await getPackageVersionById(locked.packageVersionId, tx);

    if (isResumableVersion(pinned, current)) return { attempt: locked, review: false, restartedAfterReplace: false };

    await closeScormAttempt(locked.id, 'replaced', tx);
  }

  const latest = await getLatestScormAttempt(activityId, profileId, tx);
  const attemptNumber = (latest?.attemptNumber ?? 0) + 1;
  const closedAt = latest?.closedAt ?? null;
  const restartedAfterReplace = latest?.closeReason === 'replaced' || Boolean(open);

  const shouldCreate =
    !latest ||
    latest.closeReason === 'replaced' ||
    (startNewAttempt && allowRetakes) ||
    (await hasComplianceCycleStartedSince(courseId, profileId, closedAt ?? latest?.startedAt ?? null, tx));

  if (!shouldCreate && latest) return { attempt: latest, review: true, restartedAfterReplace: false };

  const created = await createScormAttempt({ activityId, profileId, packageVersionId: current.id, attemptNumber }, tx);

  return { attempt: created, review: false, restartedAfterReplace: restartedAfterReplace && attemptNumber > 1 };
}

async function resolveTry(attemptId: string, unitId: string, tx: DbOrTxClient): Promise<TScormScoAttempt> {
  const open = await getOpenScoAttempt(attemptId, unitId, tx);
  if (open) return open;

  return createScoAttempt({ attemptId, unitId }, tx);
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
  format: ScormPackageFormat,
  sequential: boolean
): TContentPackageUnit {
  const launchable = launchableUnits(units);

  if (unitIdentifier) {
    const chosen = launchable.find((unit) => unit.identifier === unitIdentifier);
    if (!chosen) throw new AppError('Module not found', ErrorCodes.NOT_FOUND, 404);
    if (sequential && lockedIdentifiers(units, tries, settings, format, true).has(chosen.identifier)) {
      throw new AppError('This module is locked until the previous modules are complete', ErrorCodes.FORBIDDEN, 403);
    }

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
  restartedAfterReplace: boolean;
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
      locked: false,
      scorePercent: null,
      status: 'not_attempted' as const,
      success: 'unknown' as const,
      maxTimeAllowed: maxTimeAllowedOf(candidate)
    }));

    const playerUrl = `${hosts.contentHost}/activity/player/${launchToken}`;

    return {
      available: true,
      playerUrl,
      mode: 'preview',
      expiresAt,
      unit: toLaunchUnit(unit),
      units: modules
    };
  }

  const runLaunch = () =>
    db.transaction(async (tx) => {
      const { attempt, review, restartedAfterReplace } = await resolveAttempt(
        context.activityId,
        context.courseId,
        context.profileId,
        current,
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
            reviewOfArchivedVersion: true,
            restartedAfterReplace: false
          };

          return launchedArchived;
        }

        const reviewUnits = launchableUnits(await listPackageUnitsByVersion(reviewVersion.id, tx));
        const reviewUnit = context.unitIdentifier
          ? (reviewUnits.find((candidate) => candidate.identifier === context.unitIdentifier) ?? null)
          : reviewUnits[0];
        if (!reviewUnit) throw new AppError('Module not found', ErrorCodes.NOT_FOUND, 404);

        const reviewTries = await latestTriesByUnit(attempt.id, tx);
        const launchedReview: LaunchedModule = {
          attempt,
          versionId: reviewVersion.id,
          format: packageFormat(reviewVersion.format),
          unit: reviewUnit,
          scoAttempt: reviewTries.get(reviewUnit.id) ?? null,
          review: true,
          reviewOfArchivedVersion: false,
          restartedAfterReplace: false
        };

        return launchedReview;
      }

      const pinned =
        attempt.packageVersionId === current.id ? current : await getPackageVersionById(attempt.packageVersionId, tx);
      if (!pinned) throw new AppError('Package version not found', ErrorCodes.NOT_FOUND, 404);

      const tries = await latestTriesByUnit(attempt.id, tx);
      const format = packageFormat(pinned.format);
      const unit = pickUnit(
        await listPackageUnitsByVersion(pinned.id, tx),
        context.unitIdentifier,
        tries,
        settings,
        format,
        details.moduleOrder === 'sequential'
      );
      const scoAttempt = await resolveTry(attempt.id, unit.id, tx);

      const launchedTry: LaunchedModule = {
        attempt,
        versionId: pinned.id,
        format,
        unit,
        scoAttempt,
        review: false,
        reviewOfArchivedVersion: false,
        restartedAfterReplace
      };

      return launchedTry;
    });

  let launched: LaunchedModule;

  try {
    launched = await runLaunch();
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) throw error;

    launched = await runLaunch();
  }

  const triesByUnit = launched.reviewOfArchivedVersion
    ? new Map<string, TScormScoAttempt>()
    : await latestTriesByUnit(launched.attempt.id);
  const versionUnits = await listPackageUnitsByVersion(launched.versionId);
  const menuUnits = launchableUnits(versionUnits);
  const sequentialMenu = !launched.review && details.moduleOrder === 'sequential';
  const locked = lockedIdentifiers(versionUnits, triesByUnit, settings, launched.format, sequentialMenu);
  const modules = menuUnits.map((unit) =>
    toLaunchModule(unit, triesByUnit.get(unit.id) ?? null, settings, launched.format, locked.has(unit.identifier))
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
    unit: toLaunchUnit(launched.unit),
    units: modules,
    ...(launched.reviewOfArchivedVersion ? { reviewOfArchivedVersion: true as const } : {}),
    ...(launched.restartedAfterReplace ? { restartedAfterReplace: true as const } : {})
  };
}

/**
 * Returns the learner's module menu as it stands, for refreshing ticks and
 * locks while a module is still running. Reads the open attempt, else the
 * latest one, and never creates, closes or replaces anything. Previews and
 * learners without an attempt see every module untouched.
 */
export async function getScormModuleProgress(context: ActivityProgressContext): Promise<ScormLaunchModule[]> {
  const details = await getActivityScormByActivityId(context.activityId);
  if (!details?.assetId) return [];

  const current = await getCurrentPackageVersion(details.assetId);
  if (!current || current.status !== 'ready') return [];

  const open = context.isPreview ? null : await getOpenScormAttempt(context.activityId, context.profileId);
  const attempt = context.isPreview || open ? open : await getLatestScormAttempt(context.activityId, context.profileId);
  const pinned =
    attempt && attempt.packageVersionId !== current.id
      ? await getPackageVersionById(attempt.packageVersionId)
      : current;
  const version = pinned && pinned.status !== 'archived' ? pinned : current;

  const tries =
    attempt && attempt.packageVersionId === version.id
      ? await latestTriesByUnit(attempt.id)
      : new Map<string, TScormScoAttempt>();
  const settings = toRuleSettings(details);
  const format = packageFormat(version.format);
  const units = await listPackageUnitsByVersion(version.id);
  const sequential = !context.isPreview && details.moduleOrder === 'sequential' && (open !== null || !attempt);
  const locked = lockedIdentifiers(units, tries, settings, format, sequential);

  return launchableUnits(units).map((unit) =>
    toLaunchModule(unit, tries.get(unit.id) ?? null, settings, format, locked.has(unit.identifier))
  );
}
