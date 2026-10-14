import { db } from '@cio/db/drizzle';
import { getActivityScormByActivityId } from '@cio/db/queries/scorm';
import { getPackageVersionById } from '@cio/db/queries/activity/package-version';
import { getPackageUnitById, listPackageUnitsByVersion } from '@cio/db/queries/activity/package-unit';
import { closeScormAttempt, getScormAttemptById } from '@cio/db/queries/scorm/attempt';
import { recordScormSessionEvent } from '@cio/db/queries/scorm/session-event';
import {
  listLatestScoAttemptsByAttempt,
  lockScoAttemptChain,
  updateScoAttempt,
  getScoAttemptById
} from '@cio/db/queries/scorm/sco-attempt';
import { getOrganizationById } from '@cio/db/queries/organization/organization';
import { getProfileById } from '@cio/db/queries/auth/profile';
import {
  PackageError,
  accumulateTryTime,
  applyLmsRules,
  isScormRuleMet,
  mergeCmi,
  mintContentToken,
  moduleOutcomeFromCmi,
  normalizeCommitCmi,
  parseCommitSessionTime,
  scormLaunchUrl,
  shouldRecordCommitEvent,
  statusAfterTerminate,
  verifyLaunchToken,
  type ActivityLaunchClaims,
  type ScormCmi,
  type ScormCommitOutcomeSnapshot
} from '@cio/activity-packages';
import type { TContentPackageUnit } from '@cio/db/types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TScormPlayerEventKind, TScormSessionEventKind } from '@cio/utils/validation/activity/scorm';
import { SCORM_PLAYER_EVENT_KINDS } from '@cio/utils/validation/activity/scorm';
import { completeActivityOnce } from '@cio/core/services/activity/activity';
import {
  attemptModuleOutcomes,
  packageFormat,
  playerFormat,
  toOutcomeUnit,
  toRuleSettings
} from '@cio/core/services/activity/providers/scorm/launch';
import { getActivitySigningSecret, orgIdFromContentKey } from '@cio/core/config/activity-content';
import { getComplianceSnapshot } from '@cio/core/services/activity/providers/scorm/results';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { runActivityCompletionSideEffects } from '@api/services/activity/activity-completion';

export interface ScormRuntimeState {
  format: 'scorm12' | 'scorm2004';
  cmi: ScormCmi;
  contentToken: string;
  launchPath: string;
  parentOrigin: string;
  parentOrigins?: string[];
  entry: string;
  commitSeq: number;
  mode: 'preview' | 'normal' | 'review';
  debug: boolean;
}

async function resolveClaims(launchToken: string): Promise<{ claims: ActivityLaunchClaims; secret: string }> {
  const secret = getActivitySigningSecret();
  if (!secret) throw new AppError('Activity run-time not configured', ErrorCodes.INTERNAL_ERROR, 503);

  try {
    const claims = await verifyLaunchToken(launchToken, secret, Date.now());

    return { claims, secret };
  } catch (error) {
    if (error instanceof PackageError && error.code === 'expired_token') {
      throw new AppError('Launch token expired', ErrorCodes.UNAUTHORIZED, 401);
    }

    throw new AppError('Invalid launch token', ErrorCodes.UNAUTHORIZED, 401);
  }
}

async function recordRuntimeEventBestEffort(
  scoAttemptId: string,
  kind: TScormSessionEventKind,
  detail: Record<string, unknown>,
  userAgent: string | null
): Promise<void> {
  try {
    await recordScormSessionEvent(scoAttemptId, kind, detail, userAgent);
  } catch (error) {
    console.error('scormRuntimeEvent error:', error);
  }
}

async function resolveParentOrigin(claims: ActivityLaunchClaims): Promise<string> {
  const organizationId = orgIdFromContentKey(claims.org);
  if (organizationId) {
    const organization = await getOrganizationById(organizationId);
    if (organization) {
      const canonical = getDashboardBaseUrl({
        siteName: organization.siteName,
        customDomain: organization.customDomain,
        isCustomDomainVerified: organization.isCustomDomainVerified
      });

      return canonical;
    }
  }

  return claims.anc[0] ?? '';
}

function entryOf(status: string, cmi: ScormCmi, commitSeq: number): string {
  if (status === 'suspended') return 'resume';
  if (status === 'active' && commitSeq === 0 && Object.keys(cmi).length === 0) return 'ab-initio';

  return '';
}

/**
 * Returns the saved run-time state for one launched module try. Preview
 * launches resolve against the current package version; normal and review
 * launches resolve the try pinned in the token.
 */
export async function getScormRuntimeState(
  launchToken: string,
  userAgent: string | null = null
): Promise<ScormRuntimeState> {
  const { claims, secret } = await resolveClaims(launchToken);

  if (claims.mode === 'preview' || !claims.att) {
    const unit = await getPackageUnitById(claims.unit);
    if (!unit) throw new AppError('Module not found', ErrorCodes.NOT_FOUND, 404);

    const version = await getPackageVersionById(unit.packageVersionId);
    if (!version) throw new AppError('Package version not found', ErrorCodes.NOT_FOUND, 404);

    const contentToken = await mintContentToken(
      { org: claims.org, prefix: version.contentPrefix, anc: claims.anc },
      secret
    );
    const parentOrigin = await resolveParentOrigin(claims);
    const parentOrigins = claims.anc && claims.anc.length > 0 ? claims.anc : [parentOrigin];
    const profile = await getProfileById(claims.sub);
    const outcomeUnit = toOutcomeUnit(unit);
    const timeLimits = timeLimitsOf(unit.formatDetails);
    const launchCmi = withLearnerFields(
      withLaunchData({}, unit.launchData),
      playerFormat(version.format),
      claims.sub,
      profile?.fullname ?? null,
      { ...outcomeUnit, ...timeLimits }
    );

    return {
      format: playerFormat(version.format),
      cmi: launchCmi,
      contentToken,
      launchPath: scormLaunchUrl(unit.href, unit.parameters),
      parentOrigin,
      parentOrigins,
      entry: 'ab-initio',
      commitSeq: 0,
      mode: 'preview',
      debug: false
    };
  }

  const scoAttempt = await getScoAttemptById(claims.att);
  if (!scoAttempt) throw new AppError('Attempt not found', ErrorCodes.NOT_FOUND, 404);

  const unit = await getPackageUnitById(scoAttempt.unitId);
  if (!unit || unit.id !== claims.unit) throw new AppError('Attempt not found', ErrorCodes.NOT_FOUND, 404);

  const attempt = await getScormAttemptById(scoAttempt.attemptId);
  if (!attempt) throw new AppError('Attempt not found', ErrorCodes.NOT_FOUND, 404);

  const version = await getPackageVersionById(attempt.packageVersionId);
  if (!version) throw new AppError('Package version not found', ErrorCodes.NOT_FOUND, 404);

  await recordRuntimeEventBestEffort(scoAttempt.id, 'launch', { mode: claims.mode, unit: claims.unit }, userAgent);

  const stored = (scoAttempt.cmi ?? {}) as ScormCmi;
  const contentToken = await mintContentToken(
    { org: claims.org, prefix: version.contentPrefix, anc: claims.anc },
    secret
  );
  const parentOrigin = await resolveParentOrigin(claims);
  const parentOrigins = claims.anc && claims.anc.length > 0 ? claims.anc : [parentOrigin];
  const profile = await getProfileById(claims.sub);
  const outcomeUnit = toOutcomeUnit(unit);
  const timeLimits = timeLimitsOf(unit.formatDetails);
  const launchCmi = withLearnerFields(
    withLaunchData(stored, unit.launchData),
    playerFormat(version.format),
    claims.sub,
    profile?.fullname ?? null,
    { ...outcomeUnit, ...timeLimits }
  );

  return {
    format: playerFormat(version.format),
    cmi: launchCmi,
    contentToken,
    launchPath: scormLaunchUrl(unit.href, unit.parameters),
    parentOrigin,
    parentOrigins,
    entry: entryOf(scoAttempt.status ?? 'active', stored, scoAttempt.commitSeq ?? 0),
    commitSeq: scoAttempt.commitSeq ?? 0,
    mode: claims.mode === 'review' ? 'review' : 'normal',
    debug: false
  };
}

function withLaunchData(cmi: ScormCmi, launchData: string | null): ScormCmi {
  if (!launchData || cmi['launch_data'] !== undefined) return cmi;

  return { ...cmi, launch_data: launchData };
}

function formatLearnerName(fullname: string | null): string | null {
  const parts = (fullname ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0] ?? null;

  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
}

function mergeRecord(base: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const current = typeof base === 'object' && base !== null ? (base as Record<string, unknown>) : {};

  return { ...current, ...patch };
}

function timeLimitsOf(formatDetails: TContentPackageUnit['formatDetails']): {
  maxTimeAllowed: string | null;
  timeLimitAction: string | null;
} {
  return {
    maxTimeAllowed: 'maxTimeAllowed' in formatDetails ? (formatDetails.maxTimeAllowed ?? null) : null,
    timeLimitAction: 'timeLimitAction' in formatDetails ? (formatDetails.timeLimitAction ?? null) : null
  };
}

function withLearnerFields(
  cmi: ScormCmi,
  format: 'scorm12' | 'scorm2004',
  profileId: string,
  fullname: string | null,
  unit: {
    masteryScoreRaw: number | null;
    passingScoreScaled: number | null;
    maxTimeAllowed: string | null;
    timeLimitAction: string | null;
  }
): ScormCmi {
  const learnerName = formatLearnerName(fullname);

  if (format === 'scorm12') {
    const current = typeof cmi['core'] === 'object' && cmi['core'] !== null ? cmi['core'] : {};
    const core: Record<string, unknown> = { ...(current as Record<string, unknown>) };
    if (core['student_id'] === undefined) core['student_id'] = profileId;
    if (core['student_name'] === undefined && learnerName !== null) core['student_name'] = learnerName;

    const next: ScormCmi = { ...cmi, core };
    const currentStudentData =
      typeof cmi['student_data'] === 'object' && cmi['student_data'] !== null
        ? (cmi['student_data'] as Record<string, unknown>)
        : {};
    const studentData: Record<string, unknown> = { ...currentStudentData };
    if (studentData['mastery_score'] === undefined && unit.masteryScoreRaw !== null) {
      studentData['mastery_score'] = String(unit.masteryScoreRaw);
    }
    if (studentData['max_time_allowed'] === undefined && unit.maxTimeAllowed !== null) {
      studentData['max_time_allowed'] = unit.maxTimeAllowed;
    }
    if (studentData['time_limit_action'] === undefined && unit.timeLimitAction !== null) {
      studentData['time_limit_action'] = unit.timeLimitAction;
    }
    if (Object.keys(studentData).length > 0) {
      next['student_data'] = studentData;
    }

    return next;
  }

  const next: ScormCmi = { ...cmi };
  if (next['learner_id'] === undefined) next['learner_id'] = profileId;
  if (next['learner_name'] === undefined && learnerName !== null) next['learner_name'] = learnerName;
  if (next['scaled_passing_score'] === undefined && unit.passingScoreScaled !== null) {
    next['scaled_passing_score'] = String(unit.passingScoreScaled);
  }
  if (next['max_time_allowed'] === undefined && unit.maxTimeAllowed !== null) {
    next['max_time_allowed'] = unit.maxTimeAllowed;
  }
  if (next['time_limit_action'] === undefined && unit.timeLimitAction !== null) {
    next['time_limit_action'] = unit.timeLimitAction;
  }

  return next;
}

export interface ScormCommitResult {
  saved: boolean;
  completedActivity: boolean;
}

/**
 * Saves one numbered commit for the module try in the token, then applies
 * the item's rule across the attempt's modules. Ignores commits not newer
 * than the stored sequence. Preview and review sessions save nothing.
 */
export async function commitScormAttempt(
  launchToken: string,
  rawBody: unknown,
  viaBeacon = false,
  userAgent: string | null = null
): Promise<ScormCommitResult> {
  const { claims } = await resolveClaims(launchToken);

  if (claims.mode !== 'normal' || !claims.att) return { saved: false, completedActivity: false };

  const scoAttemptId = claims.att;
  let commit;
  try {
    commit = normalizeCommitCmi(rawBody);
  } catch (error) {
    const scoAttempt = await getScoAttemptById(scoAttemptId);

    if (scoAttempt) {
      const reason = error instanceof PackageError ? error.code : 'invalid_payload';
      await recordRuntimeEventBestEffort(scoAttempt.id, 'error', { reason }, userAgent);
    }

    if (error instanceof PackageError) throw new AppError(error.message, ErrorCodes.VALIDATION_ERROR, 400);

    throw error;
  }

  const result = await db.transaction(async (tx) => {
    const chain = await lockScoAttemptChain(scoAttemptId, tx);
    if (!chain) return { unknownTry: true as const };

    const activityId = chain.attempt.activityId;
    const profileId = chain.attempt.profileId;
    if (commit.seq <= chain.scoAttempt.commitSeq)
      return { saved: false, completedActivity: false, activityId, profileId, rejected: true as const };

    const unit = await getPackageUnitById(chain.scoAttempt.unitId, tx);
    if (!unit) throw new AppError('Attempt not found', ErrorCodes.NOT_FOUND, 404);

    const version = await getPackageVersionById(chain.attempt.packageVersionId, tx);
    if (!version) throw new AppError('Package version not found', ErrorCodes.NOT_FOUND, 404);

    const format = packageFormat(version.format);
    const outcomeUnit = toOutcomeUnit(unit);
    const stored = (chain.scoAttempt.cmi ?? {}) as ScormCmi;
    const merged = applyLmsRules(mergeCmi(stored, commit.cmi), outcomeUnit, format, {
      terminated: commit.terminate
    });
    const nextStatus = commit.terminate ? statusAfterTerminate(merged, format) : chain.scoAttempt.status;
    const previousOutcome = moduleOutcomeFromCmi(stored, format, outcomeUnit);
    const nextOutcome = moduleOutcomeFromCmi(merged, format, outcomeUnit);
    const previous: ScormCommitOutcomeSnapshot = {
      completion: previousOutcome.completion,
      success: previousOutcome.success,
      scaledScore: previousOutcome.scaledScore,
      tryStatus: chain.scoAttempt.status
    };
    const next: ScormCommitOutcomeSnapshot = {
      completion: nextOutcome.completion,
      success: nextOutcome.success,
      scaledScore: nextOutcome.scaledScore,
      tryStatus: nextStatus
    };
    const shouldRecord = shouldRecordCommitEvent(previous, next, {
      isFirstCommit: chain.scoAttempt.commitSeq === 0,
      isTerminate: commit.terminate,
      isBeacon: viaBeacon || commit.beacon === true,
      isRejected: false
    });
    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();
    const sessionTimeSeconds = parseCommitSessionTime(commit.cmi, format);
    const lastActivityMs = new Date(chain.scoAttempt.lastCommitAt ?? chain.scoAttempt.startedAt).getTime();
    const currentTimeSpent = chain.scoAttempt.timeSpentSeconds ?? 0;
    const nextTimeSpent = accumulateTryTime(currentTimeSpent, sessionTimeSeconds, lastActivityMs, nowMs);
    await updateScoAttempt(
      chain.scoAttempt.id,
      {
        cmi: merged,
        commitSeq: commit.seq,
        status: nextStatus,
        lastCommitAt: now,
        timeSpentSeconds: nextTimeSpent,
        ...(nextStatus === 'closed' ? { terminatedAt: now } : {})
      },
      tx
    );

    const details = await getActivityScormByActivityId(activityId, tx);
    if (!details)
      return { saved: true, completedActivity: false, activityId, profileId, rejected: false as const, shouldRecord };

    const units = await listPackageUnitsByVersion(version.id, tx);
    const latest = await listLatestScoAttemptsByAttempt(chain.attempt.id, tx);
    const triesByUnit = new Map(latest.map((row) => [row.unitId, row]));
    const outcomes = attemptModuleOutcomes(units, triesByUnit, format);
    if (!isScormRuleMet(toRuleSettings(details), outcomes)) {
      return { saved: true, completedActivity: false, activityId, profileId, rejected: false as const, shouldRecord };
    }

    await closeScormAttempt(chain.attempt.id, 'finished', tx);
    const completedActivity = await completeActivityOnce(activityId, profileId, tx);

    return { saved: true, completedActivity, activityId, profileId, rejected: false as const, shouldRecord };
  });

  if ('unknownTry' in result) {
    const missing = await getScoAttemptById(scoAttemptId);

    if (missing) {
      await recordRuntimeEventBestEffort(scoAttemptId, 'error', { reason: 'unknown_try' }, userAgent);
    }

    throw new AppError('Attempt not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (result.completedActivity) {
    const snapshot = await getComplianceSnapshot(result.activityId, result.profileId);
    await runActivityCompletionSideEffects(result.activityId, result.profileId, snapshot?.minutes);
  }

  if (!result.saved && 'rejected' in result && result.rejected) {
    await recordRuntimeEventBestEffort(scoAttemptId, 'error', { reason: 'stale_sequence', seq: commit.seq }, userAgent);

    return { saved: false, completedActivity: false };
  }

  if (result.saved && 'shouldRecord' in result && result.shouldRecord) {
    const beacon = viaBeacon || commit.beacon === true;
    const kind: TScormSessionEventKind = beacon ? 'beacon' : commit.terminate ? 'terminate' : 'commit';
    const detail: Record<string, unknown> = { seq: commit.seq };

    if (commit.terminate) detail['terminate'] = true;

    await recordRuntimeEventBestEffort(scoAttemptId, kind, detail, userAgent);
  }

  return { saved: result.saved, completedActivity: result.completedActivity };
}

/**
 * Records one player-observed event for the try in the token. Preview and
 * review sessions record nothing. Returns whether a row was written.
 */
export async function reportScormRuntimeEvent(
  launchToken: string,
  kind: TScormPlayerEventKind,
  detail: Record<string, unknown>,
  userAgent: string | null = null
): Promise<{ recorded: boolean }> {
  if (!SCORM_PLAYER_EVENT_KINDS.includes(kind))
    throw new AppError('Invalid event kind', ErrorCodes.VALIDATION_ERROR, 400);

  const { claims } = await resolveClaims(launchToken);

  if (claims.mode !== 'normal' || !claims.att) return { recorded: false };

  const scoAttempt = await getScoAttemptById(claims.att);
  if (!scoAttempt) throw new AppError('Attempt not found', ErrorCodes.NOT_FOUND, 404);

  await recordScormSessionEvent(scoAttempt.id, kind, detail, userAgent);

  return { recorded: true };
}
