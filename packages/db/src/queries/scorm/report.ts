import { sql } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TScormResultsQuery } from '@cio/utils/validation/activity';

import { scormTryOutcomeColumns } from './outcome';

export type ScormLearnerStatus = 'not_started' | 'in_progress' | 'failed' | 'completed';
export type ScormPassFail = 'passed' | 'failed' | null;

export interface ScormResultModule {
  unitId: string;
  identifier: string;
  title: string;
  position: number;
  tryId: string | null;
  tryStatus: string | null;
  completion: string;
  success: string;
  scaledScore: number | null;
  hasPassMark: boolean;
  timeSpentSeconds: number;
}

export interface ScormLearnerResultRow {
  profileId: string;
  fullname: string | null;
  email: string | null;
  attempts: number;
  lastLaunchedAt: string | null;
  timeSpentSeconds: number;
  scorePercent: number | null;
  bestScorePercent: number | null;
  completed: boolean;
  completedAt: string | null;
  latestRuleMet: boolean;
  latestAnyPassed: boolean;
  latestAnyFailed: boolean;
  modules: ScormResultModule[];
}

export interface ScormRollupSettings {
  rule: string;
  minScorePercent: number | null;
  completionModules: string;
}

export interface ScormAttemptTryRow {
  attemptId: string;
  attemptNumber: number;
  attemptStartedAt: string;
  attemptClosedAt: string | null;
  attemptCloseReason: string | null;
  packageVersionNumber: number | null;
  packageFormat: string | null;
  tryId: string | null;
  tryStatus: string | null;
  unitId: string | null;
  unitIdentifier: string | null;
  unitTitle: string | null;
  unitPosition: number | null;
  unitType: string | null;
  masteryScoreRaw: string | null;
  passingScoreScaled: string | null;
  completionThreshold: string | null;
  cmi: Record<string, unknown>;
  commitSeq: number | null;
  tryStartedAt: string | null;
  lastCommitAt: string | null;
  terminatedAt: string | null;
  timeSpentSeconds: number;
}

export interface ScormResultsSummary {
  enrolled: number;
  started: number;
  completed: number;
  passed: number;
  averageScore: number | null;
}

const MODULE_OUTCOME_FIELDS = `'unitId', m.unit_id, 'identifier', m.identifier, 'title', m.title, 'position', m.position, 'tryId', m.try_id, 'tryStatus', m.try_status, 'completion', m.completion, 'success', m.success, 'scaledScore', m.scaled_score, 'hasPassMark', m.has_pass_mark, 'timeSpentSeconds', COALESCE(m.try_seconds, 0)`;

function profileList(profiles: string[]) {
  return sql`SELECT UNNEST(ARRAY[${sql.join(
    profiles.map((profileId) => sql`${profileId}::uuid`),
    sql`, `
  )}]) AS profile_id`;
}

/**
 * Shared rollup over every attempt of the given learners: per attempt and
 * module outcomes from the SQL mapping, the completion rule evaluated with
 * the bound item settings, and per-learner totals. Both the paged list and
 * the summary build on it so they can never disagree.
 */
function attemptRollupCte(activityId: string, profileIds: string[], settings: ScormRollupSettings) {
  const outcome = scormTryOutcomeColumns({
    cmi: sql`t.cmi`,
    format: sql`v.format`,
    masteryScoreRaw: sql`u.mastery_score_raw`,
    passingScoreScaled: sql`u.passing_score_scaled`
  });

  return sql`
    learners AS (${profileList(profileIds)}),
    learner_attempts AS (
      SELECT a.id, a.profile_id, a.attempt_number, a.package_version_id, a.started_at, a.closed_at,
             ROW_NUMBER() OVER (
               PARTITION BY a.profile_id
               ORDER BY (a.closed_at IS NULL) DESC, COALESCE(a.closed_at, a.started_at) DESC, a.attempt_number DESC
             ) AS recency
      FROM scorm_attempt a
      JOIN learners l ON l.profile_id = a.profile_id
      WHERE a.activity_id = ${activityId}
        AND a.close_reason IS DISTINCT FROM 'replaced'
    ),
    ranked_tries AS (
      SELECT t.*,
             ROW_NUMBER() OVER (PARTITION BY t.attempt_id, t.unit_id ORDER BY t.started_at DESC, t.id DESC) AS rn
      FROM scorm_sco_attempt t
      JOIN learner_attempts la ON la.id = t.attempt_id
    ),
    attempt_modules AS (
      SELECT la.profile_id, la.id AS attempt_id, la.attempt_number,
             (la.recency = 1) AS is_latest,
             la.started_at AS launched_at,
             u.id AS unit_id, u.identifier, u.title, u.position,
             t.id AS try_id, t.status AS try_status,
             ${outcome.completion} AS completion,
             ${outcome.success} AS success,
             ${outcome.scaledScore} AS scaled_score,
             ${outcome.hasPassMark} AS has_pass_mark,
             COALESCE(t.time_spent_seconds, 0) AS try_seconds
      FROM learner_attempts la
      JOIN content_package_unit u ON u.package_version_id = la.package_version_id AND u.unit_type = 'sco' AND u.is_visible IS NOT FALSE
      LEFT JOIN ranked_tries t ON t.attempt_id = la.id AND t.unit_id = u.id AND t.rn = 1
      JOIN content_package_version v ON v.id = la.package_version_id
    ),
    attempt_rollup AS (
      SELECT profile_id, attempt_id, attempt_number, launched_at, is_latest,
             COUNT(*)::int AS modules_total,
             COUNT(*) FILTER (WHERE completion = 'completed')::int AS modules_completed,
             COUNT(*) FILTER (WHERE success = 'passed')::int AS modules_passed,
             BOOL_OR(success = 'failed') AS any_failed,
             BOOL_OR(success = 'passed') AS any_passed,
             AVG(scaled_score) AS score_frac,
             (COUNT(*) > 0 AND CASE
                WHEN ${settings.completionModules} = 'graded_only'
                  AND BOOL_OR(has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL) THEN
                  CASE ${settings.rule}
                    WHEN 'completed' THEN COUNT(*) FILTER (WHERE (has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL) AND completion = 'completed')
                      = COUNT(*) FILTER (WHERE has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL)
                    WHEN 'passed' THEN COUNT(*) FILTER (WHERE (has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL) AND success = 'passed')
                      = COUNT(*) FILTER (WHERE has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL)
                    WHEN 'score' THEN COUNT(*) FILTER (WHERE (has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL) AND completion = 'completed')
                      = COUNT(*) FILTER (WHERE has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL)
                      AND AVG(scaled_score) FILTER (WHERE has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL) IS NOT NULL
                      AND ROUND((AVG(scaled_score) FILTER (WHERE has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL) * 100)::numeric, 2) >= COALESCE(${settings.minScorePercent}, 100)
                    ELSE COUNT(*) FILTER (WHERE (has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL)
                      AND CASE WHEN (has_pass_mark OR success <> 'unknown')
                        THEN success = 'passed'
                        ELSE completion = 'completed' END)
                      = COUNT(*) FILTER (WHERE has_pass_mark OR success <> 'unknown' OR scaled_score IS NOT NULL)
                  END
                ELSE
                  CASE ${settings.rule}
                    WHEN 'completed' THEN COUNT(*) FILTER (WHERE completion = 'completed') = COUNT(*)
                    WHEN 'passed' THEN COUNT(*) FILTER (WHERE success = 'passed') = COUNT(*)
                    WHEN 'score' THEN COUNT(*) FILTER (WHERE completion = 'completed') = COUNT(*)
                      AND AVG(scaled_score) IS NOT NULL
                      AND ROUND((AVG(scaled_score) * 100)::numeric, 2) >= COALESCE(${settings.minScorePercent}, 100)
                    ELSE SUM(CASE WHEN (has_pass_mark OR success <> 'unknown')
                      THEN CASE WHEN success = 'passed' THEN 1 ELSE 0 END
                      ELSE CASE WHEN completion = 'completed' THEN 1 ELSE 0 END
                    END) = COUNT(*)
                  END
              END) AS rule_met
      FROM attempt_modules
      GROUP BY profile_id, attempt_id, attempt_number, launched_at, is_latest
    ),
    learner_totals AS (
      SELECT profile_id,
             COUNT(*)::int AS attempts,
             MAX(score_frac) AS best_frac,
             MAX(launched_at) AS last_launched,
             (SELECT COALESCE(SUM(t.time_spent_seconds), 0)::int
                FROM scorm_sco_attempt t
                JOIN learner_attempts la ON la.id = t.attempt_id
               WHERE la.profile_id = ar.profile_id) AS total_seconds
      FROM attempt_rollup ar
      GROUP BY profile_id
    )`;
}

/**
 * Paged learner rows for the Results tab, newest or ranked first. Each row
 * carries the latest attempt's per-module outcomes so the completion rule is
 * evaluated once, in SQL, exactly like the summary below.
 */
export async function listScormLearnerResults(
  activityId: string,
  profileIds: string[],
  settings: ScormRollupSettings,
  paging: TScormResultsQuery,
  dbClient: DbOrTxClient = db
): Promise<{ rows: ScormLearnerResultRow[]; total: number }> {
  try {
    if (profileIds.length === 0) return { rows: [], total: 0 };

    const sortExpression =
      paging.sort === 'name'
        ? sql`COALESCE(fullname, '')`
        : paging.sort === 'score'
          ? sql`latest_score`
          : paging.sort === 'status'
            ? sql`status_rank`
            : paging.sort === 'attempts'
              ? sql`COALESCE(attempts, 0)`
              : sql`last_launched_at`;
    const direction = paging.direction === 'asc' ? sql.raw('ASC') : sql.raw('DESC');
    const offset = (paging.page - 1) * paging.limit;

    const result = await dbClient.execute(sql`
      WITH ${attemptRollupCte(activityId, profileIds, settings)},
      learner_rows AS (
        SELECT l.profile_id, p.fullname, p.email,
               (ac.is_complete IS TRUE) AS completed,
               ac.completed_at,
               COALESCE(lt.attempts, 0)::int AS attempts,
               lt.last_launched AS last_launched_at,
               COALESCE(lt.total_seconds, 0)::int AS time_spent_seconds,
               CASE WHEN latest.score_frac IS NULL THEN NULL ELSE ROUND((latest.score_frac * 100)::numeric, 1) END AS latest_score,
               CASE WHEN lt.best_frac IS NULL THEN NULL ELSE ROUND((lt.best_frac * 100)::numeric, 1) END AS best_score,
               COALESCE(latest.rule_met, FALSE) AS latest_rule_met,
               COALESCE(latest.any_passed, FALSE) AS latest_any_passed,
               COALESCE(latest.any_failed, FALSE) AS latest_any_failed,
               CASE WHEN (ac.is_complete IS TRUE) THEN 0
                    WHEN lt.attempts IS NULL THEN 3
                    WHEN COALESCE(latest.any_failed, FALSE) AND NOT COALESCE(latest.rule_met, FALSE) THEN 1
                    ELSE 2 END AS status_rank,
               (SELECT COALESCE(json_agg(jsonb_build_object(${sql.raw(MODULE_OUTCOME_FIELDS)}) ORDER BY m.position), '[]'::json)
                FROM attempt_modules m
                WHERE m.profile_id = l.profile_id AND m.is_latest) AS modules
        FROM learners l
        LEFT JOIN profile p ON p.id = l.profile_id
        LEFT JOIN activity_completion ac ON ac.activity_id = ${activityId} AND ac.profile_id = l.profile_id
        LEFT JOIN learner_totals lt ON lt.profile_id = l.profile_id
        LEFT JOIN attempt_rollup latest ON latest.profile_id = l.profile_id AND latest.is_latest
      )
      SELECT * FROM learner_rows
      ORDER BY ${sortExpression} ${direction} NULLS LAST, COALESCE(fullname, ''), profile_id
      LIMIT ${paging.limit} OFFSET ${offset}`);

    const rows = (result as unknown as Array<Record<string, unknown>>).map((row) => {
      const profileId = String(row['profile_id']);
      const fullname = row['fullname'] === null ? null : String(row['fullname']);
      const email = row['email'] === null ? null : String(row['email']);
      const attempts = Number(row['attempts'] ?? 0);
      const lastLaunchedAt = row['last_launched_at'] === null ? null : String(row['last_launched_at']);
      const timeSpentSeconds = Number(row['time_spent_seconds'] ?? 0);
      const scorePercent = row['latest_score'] === null ? null : Number(row['latest_score']);
      const bestScorePercent = row['best_score'] === null ? null : Number(row['best_score']);
      const completed = row['completed'] === true;
      const completedAt = row['completed_at'] === null ? null : String(row['completed_at']);
      const latestRuleMet = row['latest_rule_met'] === true;
      const latestAnyPassed = row['latest_any_passed'] === true;
      const latestAnyFailed = row['latest_any_failed'] === true;
      const modules = (row['modules'] ?? []) as ScormResultModule[];

      return {
        profileId,
        fullname,
        email,
        attempts,
        lastLaunchedAt,
        timeSpentSeconds,
        scorePercent,
        bestScorePercent,
        completed,
        completedAt,
        latestRuleMet,
        latestAnyPassed,
        latestAnyFailed,
        modules
      };
    });

    return { rows, total: profileIds.length };
  } catch (error) {
    console.error('listScormLearnerResults error:', error);
    throw new Error(
      `Failed to list SCORM learner results for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Totalling row for the Results tab header. Built on the same rollup as the
 * paged list, so the counts always match the rows.
 */
export async function getScormResultsSummary(
  activityId: string,
  profileIds: string[],
  settings: ScormRollupSettings,
  dbClient: DbOrTxClient = db
): Promise<ScormResultsSummary> {
  try {
    if (profileIds.length === 0) {
      return { enrolled: 0, started: 0, completed: 0, passed: 0, averageScore: null };
    }

    const result = await dbClient.execute(sql`
      WITH ${attemptRollupCte(activityId, profileIds, settings)},
      learner_marks AS (
        SELECT l.profile_id,
               (lt.attempts IS NOT NULL OR ac.is_complete IS TRUE) AS started,
               (ac.is_complete IS TRUE) AS completed,
               (COALESCE(latest.rule_met, FALSE)
                 AND (${settings.rule} IN ('passed', 'score') OR COALESCE(latest.any_passed, FALSE))) AS passed,
               lt.best_frac AS best_frac
        FROM learners l
        LEFT JOIN learner_totals lt ON lt.profile_id = l.profile_id
        LEFT JOIN activity_completion ac ON ac.activity_id = ${activityId} AND ac.profile_id = l.profile_id
        LEFT JOIN attempt_rollup latest ON latest.profile_id = l.profile_id AND latest.is_latest
      )
      SELECT COUNT(*)::int AS enrolled,
             COUNT(*) FILTER (WHERE started)::int AS started,
             COUNT(*) FILTER (WHERE completed)::int AS completed,
             COUNT(*) FILTER (WHERE passed)::int AS passed,
             ROUND((AVG(best_frac) * 100)::numeric, 1) AS average_score
      FROM learner_marks`);

    const row = (result as unknown as Array<Record<string, unknown>>)[0];

    const enrolled = Number(row?.['enrolled'] ?? 0);
    const started = Number(row?.['started'] ?? 0);
    const completed = Number(row?.['completed'] ?? 0);
    const passed = Number(row?.['passed'] ?? 0);
    const averageScore =
      row?.['average_score'] === null || row?.['average_score'] === undefined ? null : Number(row['average_score']);

    return {
      enrolled,
      started,
      completed,
      passed,
      averageScore
    };
  } catch (error) {
    console.error('getScormResultsSummary error:', error);
    throw new Error(
      `Failed to get SCORM results summary for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface ScormActivityStatRow {
  activityId: string;
  attempts: number;
  scorePercent: number | null;
  bestScorePercent: number | null;
  timeSpentSeconds: number;
  completed: boolean;
  lastLaunchedAt: string | null;
}

/**
 * One lean row per activity for a single learner: latest and best attempt
 * scores, attempt count and completion. Powers the student page without
 * hauling per-module outcomes.
 */
export async function getScormActivityStatsForProfile(
  activityIds: string[],
  profileId: string,
  dbClient: DbOrTxClient = db,
  sinceIso: string | null = null
): Promise<ScormActivityStatRow[]> {
  try {
    if (activityIds.length === 0) return [];

    const outcome = scormTryOutcomeColumns({
      cmi: sql`t.cmi`,
      format: sql`v.format`,
      masteryScoreRaw: sql`u.mastery_score_raw`,
      passingScoreScaled: sql`u.passing_score_scaled`
    });
    const sinceClause = sinceIso === null ? sql`` : sql`AND a.started_at >= ${sinceIso}::timestamptz`;
    const sinceJoinClause = sinceIso === null ? sql`` : sql`AND a2.started_at >= ${sinceIso}::timestamptz`;

    const result = await dbClient.execute(sql`
      WITH activities AS (SELECT UNNEST(ARRAY[${sql.join(
        activityIds.map((activityId) => sql`${activityId}::uuid`),
        sql`, `
      )}]) AS activity_id),
      learner_attempts AS (
        SELECT a.activity_id, a.id, a.attempt_number, a.package_version_id, a.started_at,
               ROW_NUMBER() OVER (
                 PARTITION BY a.activity_id
                 ORDER BY (a.closed_at IS NULL) DESC, COALESCE(a.closed_at, a.started_at) DESC, a.attempt_number DESC
               ) AS recency
        FROM scorm_attempt a
        JOIN activities act ON act.activity_id = a.activity_id
        WHERE a.profile_id = ${profileId}
          AND a.close_reason IS DISTINCT FROM 'replaced' ${sinceClause}
      ),
      ranked_tries AS (
        SELECT t.*,
               ROW_NUMBER() OVER (PARTITION BY t.attempt_id, t.unit_id ORDER BY t.started_at DESC, t.id DESC) AS rn
        FROM scorm_sco_attempt t
        JOIN learner_attempts la ON la.id = t.attempt_id
      ),
      attempt_scores AS (
        SELECT la.activity_id, la.id AS attempt_id, (la.recency = 1) AS is_latest, la.started_at,
               AVG(${outcome.scaledScore}) AS score_frac
        FROM learner_attempts la
        JOIN content_package_unit u ON u.package_version_id = la.package_version_id AND u.unit_type = 'sco' AND u.is_visible IS NOT FALSE
        LEFT JOIN ranked_tries t ON t.attempt_id = la.id AND t.unit_id = u.id AND t.rn = 1
        JOIN content_package_version v ON v.id = la.package_version_id
        GROUP BY la.activity_id, la.id, la.recency, la.started_at
      ),
      per_activity AS (
        SELECT act.activity_id,
               COUNT(s.attempt_id)::int AS attempts,
               MAX(s.score_frac) AS best_frac,
               MAX(s.score_frac) FILTER (WHERE s.is_latest) AS latest_frac,
               MAX(s.started_at) AS last_launched,
               (SELECT COALESCE(SUM(t.time_spent_seconds), 0)::int
                FROM scorm_sco_attempt t
                JOIN scorm_attempt a2 ON a2.id = t.attempt_id
                WHERE a2.activity_id = act.activity_id
                  AND a2.profile_id = ${profileId}
                  AND a2.close_reason IS DISTINCT FROM 'replaced' ${sinceJoinClause}) AS total_seconds
        FROM activities act
        LEFT JOIN attempt_scores s ON s.activity_id = act.activity_id
        GROUP BY act.activity_id
      )
      SELECT pa.activity_id,
             pa.attempts,
             CASE WHEN pa.latest_frac IS NULL THEN NULL ELSE ROUND((pa.latest_frac * 100)::numeric, 1) END AS score_percent,
             CASE WHEN pa.best_frac IS NULL THEN NULL ELSE ROUND((pa.best_frac * 100)::numeric, 1) END AS best_score_percent,
             pa.total_seconds AS time_spent_seconds,
             (ac.is_complete IS TRUE) AS completed,
             pa.last_launched AS last_launched_at
      FROM per_activity pa
      LEFT JOIN activity_completion ac ON ac.activity_id = pa.activity_id AND ac.profile_id = ${profileId}`);

    return (result as unknown as Array<Record<string, unknown>>).map((row) => {
      const activityId = String(row['activity_id']);
      const attempts = Number(row['attempts'] ?? 0);
      const scorePercent = row['score_percent'] === null ? null : Number(row['score_percent']);
      const bestScorePercent = row['best_score_percent'] === null ? null : Number(row['best_score_percent']);
      const timeSpentSeconds = Number(row['time_spent_seconds'] ?? 0);
      const completed = row['completed'] === true;
      const lastLaunchedAt = row['last_launched_at'] === null ? null : String(row['last_launched_at']);

      return {
        activityId,
        attempts,
        scorePercent,
        bestScorePercent,
        timeSpentSeconds,
        completed,
        lastLaunchedAt
      };
    });
  } catch (error) {
    console.error('getScormActivityStatsForProfile error:', error);
    throw new Error(
      `Failed to get SCORM activity stats for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
export async function getScormLearnerAttempts(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<ScormAttemptTryRow[]> {
  try {
    const result = await dbClient.execute(sql`
      WITH ranked_tries AS (
        SELECT t.*,
               ROW_NUMBER() OVER (PARTITION BY t.attempt_id, t.unit_id ORDER BY t.started_at DESC, t.id DESC) AS rn
        FROM scorm_sco_attempt t
        JOIN scorm_attempt a2 ON a2.id = t.attempt_id
        WHERE a2.activity_id = ${activityId} AND a2.profile_id = ${profileId}
      )
      SELECT a.id AS attempt_id, a.attempt_number, a.started_at AS attempt_started_at,
             a.closed_at AS attempt_closed_at, a.close_reason AS attempt_close_reason,
             v.version_number AS package_version_number, v.format AS package_format,
             t.id AS try_id, t.status AS try_status,
             u.id AS unit_id, u.identifier AS unit_identifier, u.title AS unit_title,
             u.position AS unit_position, u.unit_type AS unit_type,
             u.mastery_score_raw,
             u.passing_score_scaled,
             u.completion_threshold,
             COALESCE(t.cmi, '{}'::jsonb) AS cmi,
             t.commit_seq, t.started_at AS try_started_at, t.last_commit_at, t.terminated_at,
             COALESCE(t.time_spent_seconds, 0) AS time_spent_seconds
      FROM scorm_attempt a
      JOIN content_package_version v ON v.id = a.package_version_id
      JOIN content_package_unit u ON u.package_version_id = a.package_version_id AND u.unit_type = 'sco' AND u.is_visible IS NOT FALSE
      LEFT JOIN ranked_tries t ON t.attempt_id = a.id AND t.unit_id = u.id AND t.rn = 1
      WHERE a.activity_id = ${activityId} AND a.profile_id = ${profileId}
      ORDER BY a.attempt_number, u.position`);

    return (result as unknown as Array<Record<string, unknown>>).map((row) => {
      const attemptId = String(row['attempt_id']);
      const attemptNumber = Number(row['attempt_number']);
      const attemptStartedAt = String(row['attempt_started_at']);
      const attemptClosedAt = row['attempt_closed_at'] === null ? null : String(row['attempt_closed_at']);
      const attemptCloseReason = row['attempt_close_reason'] === null ? null : String(row['attempt_close_reason']);
      const packageVersionNumber =
        row['package_version_number'] === null ? null : Number(row['package_version_number']);
      const packageFormat = row['package_format'] === null ? null : String(row['package_format']);
      const tryId = row['try_id'] === null ? null : String(row['try_id']);
      const tryStatus = row['try_status'] === null ? null : String(row['try_status']);
      const unitId = row['unit_id'] === null ? null : String(row['unit_id']);
      const unitIdentifier = row['unit_identifier'] === null ? null : String(row['unit_identifier']);
      const unitTitle = row['unit_title'] === null ? null : String(row['unit_title']);
      const unitPosition = row['unit_position'] === null ? null : Number(row['unit_position']);
      const unitType = row['unit_type'] === null ? null : String(row['unit_type']);
      const masteryScoreRaw = row['mastery_score_raw'] === null ? null : String(row['mastery_score_raw']);
      const passingScoreScaled = row['passing_score_scaled'] === null ? null : String(row['passing_score_scaled']);
      const completionThreshold = row['completion_threshold'] === null ? null : String(row['completion_threshold']);
      const cmi = (row['cmi'] ?? {}) as Record<string, unknown>;
      const commitSeq = row['commit_seq'] === null ? null : Number(row['commit_seq']);
      const tryStartedAt = row['try_started_at'] === null ? null : String(row['try_started_at']);
      const lastCommitAt = row['last_commit_at'] === null ? null : String(row['last_commit_at']);
      const terminatedAt = row['terminated_at'] === null ? null : String(row['terminated_at']);
      const timeSpentSeconds = Number(row['time_spent_seconds'] ?? 0);

      return {
        attemptId,
        attemptNumber,
        attemptStartedAt,
        attemptClosedAt,
        attemptCloseReason,
        packageVersionNumber,
        packageFormat,
        tryId,
        tryStatus,
        unitId,
        unitIdentifier,
        unitTitle,
        unitPosition,
        unitType,
        masteryScoreRaw,
        passingScoreScaled,
        completionThreshold,
        cmi,
        commitSeq,
        tryStartedAt,
        lastCommitAt,
        terminatedAt,
        timeSpentSeconds
      };
    });
  } catch (error) {
    console.error('getScormLearnerAttempts error:', error);
    throw new Error(
      `Failed to get SCORM attempts for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
