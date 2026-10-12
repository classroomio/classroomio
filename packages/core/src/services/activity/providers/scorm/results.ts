import {
  averageScaledScore,
  isScormRuleMet,
  moduleOutcomeFromCmi,
  type ScormCmi,
  type ScormModuleOutcome,
  type ScormPackageFormat,
  type ScormRuleSettings
} from '@cio/activity-packages';
import { deleteScormAttemptsByLearner } from '@cio/db/queries/scorm/reset';
import {
  getScormActivityStatsForProfile,
  getScormLearnerAttempts,
  getScormResultsSummary,
  listScormLearnerResults,
  type ScormAttemptTryRow
} from '@cio/db/queries/scorm/report';
import { listScormSessionEventsByLearner } from '@cio/db/queries/scorm/session-event';
import { getActivityScormByActivityId } from '@cio/db/queries/scorm/activity-scorm';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TScormResultsQuery } from '@cio/utils/validation/activity/report';
import { ZScormSettings } from '@cio/utils/validation/activity/scorm';
import type { TScormSettings } from '@cio/utils/validation/activity/scorm';

import type {
  ActivityComplianceSnapshot,
  ActivityLearnerAttempt,
  ActivityLearnerAttemptModule,
  ActivityLearnerDetail,
  ActivityLearnerInteraction,
  ActivityLearnerPassFail,
  ActivityLearnerStatus,
  ActivityLearnerSummary,
  ActivityModuleEvent,
  ActivityResultsSummary
} from '../types';

function ruleSettingsOf(settings: TScormSettings): { rule: ScormRuleSettings['rule']; minScorePercent: number | null } {
  return { rule: settings.completionRule, minScorePercent: settings.minScorePercent ?? null };
}

function percent(fraction: number | null): number | null {
  if (fraction === null) return null;

  return Math.round(fraction * 1000) / 10;
}

function learnerStatus(
  completed: boolean,
  attempts: number,
  ruleMet: boolean,
  anyFailed: boolean
): ActivityLearnerStatus {
  if (completed) return 'completed';
  if (attempts === 0) return 'not_started';
  if (!ruleMet && anyFailed) return 'failed';

  return 'in_progress';
}

function learnerPassFail(
  rule: TScormSettings['completionRule'],
  ruleMet: boolean,
  anyPassed: boolean,
  anyFailed: boolean
): ActivityLearnerPassFail {
  if (ruleMet) {
    return rule === 'passed' || rule === 'score' || anyPassed ? 'passed' : null;
  }

  return anyFailed ? 'failed' : null;
}

async function settingsOf(activityId: string): Promise<TScormSettings> {
  const details = await getActivityScormByActivityId(activityId);

  return ZScormSettings.parse({
    completionRule: details?.completionRule ?? 'auto',
    minScorePercent: details?.minScorePercent ?? null,
    allowRetakes: details?.allowRetakes ?? false,
    launchMode: details?.launchMode ?? 'embedded'
  });
}

/**
 * Paged learner rows for the Results tab with the summary header.
 */
export async function listScormResults(
  activityId: string,
  profileIds: string[],
  paging: TScormResultsQuery
): Promise<{
  summary: Awaited<ReturnType<typeof getScormResultsSummary>>;
  learners: ActivityLearnerSummary[];
  total: number;
}> {
  const settings = await settingsOf(activityId);
  const rule = ruleSettingsOf(settings);
  const [summary, listed] = await Promise.all([
    getScormResultsSummary(activityId, profileIds, { rule: rule.rule, minScorePercent: rule.minScorePercent }),
    listScormLearnerResults(activityId, profileIds, { rule: rule.rule, minScorePercent: rule.minScorePercent }, paging)
  ]);

  const learners = listed.rows.map((row): ActivityLearnerSummary => {
    const modules: ScormModuleOutcome[] = row.modules.map((module) => ({
      completion: module.completion as ScormModuleOutcome['completion'],
      success: module.success as ScormModuleOutcome['success'],
      hasPassMark: module.hasPassMark,
      scaledScore: module.scaledScore
    }));
    const ruleMet = row.attempts === 0 ? false : isScormRuleMet(rule, modules);

    return {
      profileId: row.profileId,
      fullname: row.fullname,
      email: row.email,
      status: learnerStatus(row.completed, row.attempts, ruleMet, row.latestAnyFailed),
      passFail: learnerPassFail(settings.completionRule, ruleMet, row.latestAnyPassed, row.latestAnyFailed),
      scorePercent: row.scorePercent,
      bestScorePercent: row.bestScorePercent,
      timeSpentSeconds: row.timeSpentSeconds,
      attempts: row.attempts,
      lastLaunchedAt: row.lastLaunchedAt
    };
  });

  return { summary, learners, total: listed.total };
}

function textOf(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value);

  return text === '' ? null : text;
}

function pathOf(cmi: ScormCmi, path: string): unknown {
  let current: unknown = cmi;

  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      const index = Number(segment);

      if (!Array.isArray(current) || !Number.isInteger(index)) return undefined;

      current = (current as unknown[])[index];
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return current;
}

function interactionOf(entry: unknown, index: number): ActivityLearnerInteraction {
  const record = (entry ?? {}) as Record<string, unknown>;
  const response = record['student_response'] ?? record['learner_response'];

  return {
    index,
    id: textOf(record['id']),
    type: textOf(record['type']),
    studentResponse: textOf(typeof response === 'object' ? JSON.stringify(response) : response),
    result: textOf(typeof record['result'] === 'object' ? JSON.stringify(record['result']) : record['result']),
    latency: textOf(record['latency'] ?? record['timestamp'])
  };
}

/**
 * Shapes the interactions a package reported, tolerating the array and
 * keyed-object forms scorm-again can store.
 */
export function summarizeInteractions(cmi: ScormCmi): ActivityLearnerInteraction[] {
  const raw = pathOf(cmi, 'interactions');

  if (Array.isArray(raw)) return raw.map((entry, index) => interactionOf(entry, index));

  if (raw !== null && typeof raw === 'object') {
    return Object.keys(raw)
      .filter((key) => /^\d+$/.test(key))
      .sort((left, right) => Number(left) - Number(right))
      .map((key, position) => interactionOf((raw as Record<string, unknown>)[key], position));
  }

  return [];
}

function secondsBetween(startedAt: string | null, endedAt: string | null): number {
  if (!startedAt || !endedAt) return 0;

  const seconds = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);

  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

function numericOrNull(value: string | null): number | null {
  return value === null ? null : Number(value);
}

/**
 * Every attempt of one learner with each module try, its outcome, and the
 * interactions the package reported. Outcomes use the same mapping as
 * commit time, exactly.
 */
export async function getScormLearnerDetail(activityId: string, profileId: string): Promise<ActivityLearnerDetail> {
  const settings = await settingsOf(activityId);
  const rule = ruleSettingsOf(settings);
  const rows = await getScormLearnerAttempts(activityId, profileId);
  const events = await listScormSessionEventsByLearner(activityId, profileId);
  const eventsByAttemptUnit = new Map<string, ActivityModuleEvent[]>();

  for (const event of events) {
    const key = `${event.attemptId}|${event.unitId}`;
    const listed = eventsByAttemptUnit.get(key);

    const entry: ActivityModuleEvent = { kind: event.kind, detail: event.detail, createdAt: event.createdAt };

    if (listed) {
      listed.push(entry);
    } else {
      eventsByAttemptUnit.set(key, [entry]);
    }
  }

  const byAttempt = new Map<string, ScormAttemptTryRow[]>();

  for (const row of rows) {
    const tries = byAttempt.get(row.attemptId);

    if (tries) {
      tries.push(row);
    } else {
      byAttempt.set(row.attemptId, [row]);
    }
  }

  const attempts: ActivityLearnerAttempt[] = [];

  for (const tries of byAttempt.values()) {
    const head = tries[0];
    if (!head) continue;

    const format = (head.packageFormat ?? 'scorm12') as ScormPackageFormat;
    const modules: ActivityLearnerAttemptModule[] = [];
    const moduleOutcomes: ScormModuleOutcome[] = [];

    for (const row of tries) {
      if (!row.unitId) continue;

      const outcome = moduleOutcomeFromCmi(row.cmi, format, {
        masteryScore: numericOrNull(row.masteryScore),
        formatDetails: {
          scaledPassingScore: numericOrNull(row.scaledPassingScore),
          completionThreshold: null,
          maxTimeAllowed: null,
          timeLimitAction: null
        }
      });
      const locationPath = format === 'scorm12' ? 'core.lesson_location' : 'location';
      const exitPath = format === 'scorm12' ? 'core.exit' : 'exit';
      const attempted = row.tryId !== null;

      modules.push({
        unitId: row.unitId,
        identifier: row.unitIdentifier ?? '',
        title: row.unitTitle ?? '',
        position: row.unitPosition ?? 0,
        tryId: row.tryId,
        status: attempted ? (row.tryStatus ?? 'active') : 'not_attempted',
        completion: outcome.completion,
        success: outcome.success,
        hasPassMark: outcome.hasPassMark,
        scaledScorePercent: percent(outcome.scaledScore),
        timeSpentSeconds: attempted
          ? secondsBetween(row.tryStartedAt, row.terminatedAt ?? row.lastCommitAt ?? row.tryStartedAt)
          : 0,
        location: attempted ? textOf(pathOf(row.cmi, locationPath)) : null,
        exit: attempted ? textOf(pathOf(row.cmi, exitPath)) : null,
        lastCommitAt: row.lastCommitAt,
        interactions: attempted ? summarizeInteractions(row.cmi) : [],
        events: eventsByAttemptUnit.get(`${head.attemptId}|${row.unitId}`) ?? []
      });
      if (attempted) moduleOutcomes.push(outcome);
    }

    modules.sort((left, right) => left.position - right.position);

    attempts.push({
      attemptNumber: head.attemptNumber,
      packageVersionNumber: head.packageVersionNumber,
      startedAt: head.attemptStartedAt,
      closedAt: head.attemptClosedAt,
      closeReason: head.attemptCloseReason,
      scorePercent: percent(averageScaledScore(moduleOutcomes)),
      ruleMet: modules.length === 0 ? false : isScormRuleMet(rule, moduleOutcomes),
      modules
    });
  }

  attempts.sort((left, right) => left.attemptNumber - right.attemptNumber);

  return { profileId, attempts };
}

/**
 * Deletes a learner's SCORM attempts for these activities. Returns the
 * number of attempts removed. Runs inside the caller's transaction.
 */
export async function resetScormLearner(activityIds: string[], profileId: string, tx: DbOrTxClient): Promise<number> {
  return deleteScormAttemptsByLearner(activityIds, profileId, tx);
}

export async function listLearnerSummaries(
  activityId: string,
  profileIds: string[],
  paging: TScormResultsQuery
): Promise<{ summary: ActivityResultsSummary; learners: ActivityLearnerSummary[]; total: number }> {
  const found = await getActivityScormByActivityId(activityId);
  if (!found) throw new AppError('Activity not found', ErrorCodes.NOT_FOUND, 404);

  return listScormResults(activityId, profileIds, paging);
}

export async function getResultsSummary(activityId: string, profileIds: string[]): Promise<ActivityResultsSummary> {
  const found = await getActivityScormByActivityId(activityId);
  if (!found) throw new AppError('Activity not found', ErrorCodes.NOT_FOUND, 404);

  const settings = await settingsOf(activityId);
  const rule = ruleSettingsOf(settings);

  return getScormResultsSummary(activityId, profileIds, { rule: rule.rule, minScorePercent: rule.minScorePercent });
}

/**
 * Best attempt score, attempt count and session minutes for the compliance
 * record. Returns null while the learner has no attempts.
 */
export async function getComplianceSnapshot(
  activityId: string,
  profileId: string
): Promise<ActivityComplianceSnapshot | null> {
  const [stat] = await getScormActivityStatsForProfile([activityId], profileId);

  if (!stat || stat.attempts === 0) return null;

  return {
    score: stat.bestScorePercent === null ? null : Math.round(stat.bestScorePercent),
    attempts: stat.attempts,
    minutes: Math.floor(stat.timeSpentSeconds / 60)
  };
}

export async function getLearnerDetail(activityId: string, profileId: string): Promise<ActivityLearnerDetail> {
  const found = await getActivityScormByActivityId(activityId);
  if (!found) throw new AppError('Activity not found', ErrorCodes.NOT_FOUND, 404);

  return getScormLearnerDetail(activityId, profileId);
}
