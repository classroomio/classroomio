import { AppError, ErrorCodes } from '@api/utils/errors';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { buildEmailBranding } from '@cio/email';
import {
  countAssignmentsByStatus,
  createCohortGoal,
  deleteCohortGoal,
  getAssignmentsForProfile,
  getLatestCompletionRecordsForProfilesAndCourses,
  getMaxScoresForProfilesAndCourses,
  getNonComplianceCourseCompletions,
  getCohortById,
  getCohortGoalAssignments,
  getCohortGoalById,
  getCohortGoals,
  getCohortGoalsByOrg,
  getCohortMembers,
  listAllActiveCohortGoals,
  listAssignmentsForReminderScan,
  type TNewCohortGoalAssignment,
  type TCohortGoal,
  type TCohortGoalAssignment,
  updateCohortGoal as updateCohortGoalQuery,
  upsertCohortGoalAssignments
} from '@cio/db/queries/cohort';
import { ROLE } from '@cio/utils/constants';
import type { TCreateCohortGoal, TUpdateCohortGoal } from '@cio/utils/validation/cohort';

const AT_RISK_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

type GoalType = TCohortGoal['type'];

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createGoal(cohortId: string, profileId: string, data: TCreateCohortGoal): Promise<TCohortGoal> {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  try {
    const goal = await createCohortGoal({
      cohortId,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      courseIds: data.courseIds,
      requiredCount: data.requiredCount ?? null,
      scoreThreshold: data.scoreThreshold ?? null,
      teamPassRateThreshold: data.teamPassRateThreshold ?? null,
      deadlineKind: data.deadlineKind,
      deadlineDate: data.deadlineDate ?? null,
      relativeDays: data.relativeDays ?? null,
      recurringMonths: data.recurringMonths ?? null,
      reminderDaysBefore: data.reminderDaysBefore,
      createdByProfileId: profileId
    });

    await evaluateGoal(goal.id).catch((error) => {
      console.error('createGoal: initial evaluation failed', error);
    });

    return goal;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create goal',
      ErrorCodes.COHORT_GOAL_CREATE_FAILED,
      500
    );
  }
}

export async function listGoals(
  cohortId: string
): Promise<Array<TCohortGoal & { statusCounts: Record<string, number> }>> {
  const goals = await getCohortGoals(cohortId);
  if (goals.length === 0) return [];

  const counts = await countAssignmentsByStatus(goals.map((goal) => goal.id));

  return goals.map((goal) => ({
    ...goal,
    statusCounts: counts.get(goal.id) ?? {}
  }));
}

export async function getGoal(goalId: string): Promise<TCohortGoal> {
  const goal = await getCohortGoalById(goalId);
  if (!goal) {
    throw new AppError('Goal not found', ErrorCodes.COHORT_GOAL_NOT_FOUND, 404);
  }

  return goal;
}

export async function updateGoal(goalId: string, data: TUpdateCohortGoal): Promise<TCohortGoal> {
  const existing = await getCohortGoalById(goalId);
  if (!existing) {
    throw new AppError('Goal not found', ErrorCodes.COHORT_GOAL_NOT_FOUND, 404);
  }

  try {
    const updated = await updateCohortGoalQuery(goalId, {
      title: data.title,
      description: data.description ?? undefined,
      type: data.type,
      courseIds: data.courseIds,
      requiredCount: data.requiredCount ?? null,
      scoreThreshold: data.scoreThreshold ?? null,
      teamPassRateThreshold: data.teamPassRateThreshold ?? null,
      reminderDaysBefore: data.reminderDaysBefore,
      deadlineKind: data.deadlineKind,
      deadlineDate: data.deadlineDate ?? null,
      relativeDays: data.relativeDays ?? null,
      recurringMonths: data.recurringMonths ?? null,
      status: data.status
    });
    if (!updated) {
      throw new AppError('Goal not found', ErrorCodes.COHORT_GOAL_NOT_FOUND, 404);
    }

    await evaluateGoal(goalId).catch((error) => {
      console.error('updateGoal: re-evaluation failed', error);
    });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update goal',
      ErrorCodes.COHORT_GOAL_UPDATE_FAILED,
      500
    );
  }
}

export async function archiveGoal(goalId: string): Promise<TCohortGoal> {
  return updateGoal(goalId, { status: 'archived' });
}

export async function removeGoal(goalId: string): Promise<TCohortGoal> {
  const deleted = await deleteCohortGoal(goalId);
  if (!deleted) {
    throw new AppError('Goal not found', ErrorCodes.COHORT_GOAL_NOT_FOUND, 404);
  }

  return deleted;
}

// ─── Evaluator ───────────────────────────────────────────────────────────────

/**
 * Compute due date for one learner against a goal.
 *
 * - none / readiness → null
 * - absolute → goal.deadlineDate
 * - relative_to_join → joinedAt + relativeDays
 * - recurring → goal.deadlineDate (current cycle); cycle advance handled elsewhere
 */
function computeDueDate(goal: TCohortGoal, joinedAt: Date): Date | null {
  if (goal.deadlineKind === 'none') return null;
  if (goal.deadlineKind === 'absolute') {
    return goal.deadlineDate ? new Date(goal.deadlineDate) : null;
  }

  if (goal.deadlineKind === 'relative_to_join') {
    if (!goal.relativeDays) return null;

    return new Date(joinedAt.getTime() + goal.relativeDays * DAY_MS);
  }

  if (goal.deadlineKind === 'recurring') {
    return goal.deadlineDate ? new Date(goal.deadlineDate) : null;
  }

  return null;
}

/**
 * Decide a per-learner status from the cached counts and dates.
 *
 * Stays completed once it reaches `completed` (cron resets handle recurring).
 */
function decideStatus(args: {
  completed: number;
  required: number;
  dueDate: Date | null;
  now: Date;
  previousStatus: TCohortGoalAssignment['status'] | null;
}): { status: TCohortGoalAssignment['status']; completedAt: Date | null } {
  const { completed, required, dueDate, now, previousStatus } = args;

  if (previousStatus === 'waived') {
    return { status: 'waived', completedAt: null };
  }

  if (required > 0 && completed >= required) {
    return { status: 'completed', completedAt: now };
  }

  if (dueDate && now.getTime() > dueDate.getTime()) {
    return { status: 'overdue', completedAt: null };
  }

  if (dueDate && dueDate.getTime() - now.getTime() < AT_RISK_DAYS * DAY_MS) {
    return { status: 'at_risk', completedAt: null };
  }

  if (completed > 0) {
    return { status: 'in_progress', completedAt: null };
  }

  return { status: 'not_started', completedAt: null };
}

/**
 * Re-evaluate every assignment for one goal.
 *
 * Pulls all student cohort-members, computes a per-learner status, and upserts
 * `program_goal_assignment`. Designed to be safe to run repeatedly (idempotent)
 * and cheap enough for daily cron over hundreds of cohorts.
 */
export async function evaluateGoal(goalId: string): Promise<{ evaluated: number }> {
  const goal = await getCohortGoalById(goalId);
  if (!goal) return { evaluated: 0 };

  const members = await getCohortMembers(goal.cohortId);
  const studentMembers = members.filter((member) => member.roleId === ROLE.STUDENT && member.profileId);
  if (studentMembers.length === 0) return { evaluated: 0 };

  const profileIds = studentMembers.map((member) => member.profileId!);
  const courseIds = goal.courseIds ?? [];

  const [completionRecords, nonComplianceCompletions, scoreMap, existingAssignments] = await Promise.all([
    getLatestCompletionRecordsForProfilesAndCourses(profileIds, courseIds),
    getNonComplianceCourseCompletions(profileIds, courseIds),
    goal.type === 'score' || goal.type === 'pass_rate'
      ? getMaxScoresForProfilesAndCourses(profileIds, courseIds)
      : Promise.resolve(new Map<string, number>()),
    getCohortGoalAssignments(goalId)
  ]);

  const completionByKey = new Map<string, { status: string; score: number | null }>();
  for (const record of completionRecords) {
    completionByKey.set(`${record.profileId}:${record.courseId}`, {
      status: record.status,
      score: record.score
    });
  }

  const previousByMember = new Map(existingAssignments.map((assignment) => [assignment.cohortMemberId, assignment]));

  const now = new Date();
  const requiredFor = (type: GoalType, total: number) =>
    type === 'n_of_m' && goal.requiredCount ? Math.min(goal.requiredCount, total) : total;

  const rows: TNewCohortGoalAssignment[] = [];

  for (const member of studentMembers) {
    if (!member.profileId) continue;

    const joinedAt = member.createdAt ? new Date(member.createdAt) : now;
    const dueDate = computeDueDate(goal, joinedAt);

    const completedCourseIds = courseIds.filter((courseId) => {
      const key = `${member.profileId}:${courseId}`;
      const record = completionByKey.get(key);

      if (record) {
        if (goal.type === 'score' || goal.type === 'pass_rate') {
          const score = scoreMap.get(key);
          return typeof score === 'number' && score >= (goal.scoreThreshold ?? 100);
        }
        if (record.status === 'compliant') return true;
      }

      // Fallback: non-compliance course where every lesson is completed.
      if (goal.type !== 'score' && goal.type !== 'pass_rate') {
        return nonComplianceCompletions.has(key);
      }

      return false;
    });

    const completed = completedCourseIds.length;
    const required = requiredFor(goal.type, courseIds.length);

    const previous = previousByMember.get(member.id);
    const decision = decideStatus({
      completed,
      required,
      dueDate,
      now,
      previousStatus: previous?.status ?? null
    });

    rows.push({
      goalId,
      cohortMemberId: member.id,
      dueDate: dueDate ? dueDate.toISOString() : null,
      status: decision.status,
      completedCount: completed,
      requiredCount: required,
      completedAt:
        decision.status === 'completed' ? (previous?.completedAt ?? decision.completedAt?.toISOString() ?? null) : null,
      lastEvaluatedAt: now.toISOString()
    });
  }

  await upsertCohortGoalAssignments(rows);

  return { evaluated: rows.length };
}

/**
 * Re-evaluate every active goal in a cohort. Used after material cohort
 * changes (member added, course added) or by cron sweeps.
 */
export async function evaluateCohortGoals(cohortId: string): Promise<{ evaluated: number }> {
  const goals = await getCohortGoals(cohortId);
  let evaluated = 0;
  for (const goal of goals) {
    const result = await evaluateGoal(goal.id);
    evaluated += result.evaluated;
  }

  return { evaluated };
}

/**
 * Re-evaluate all goals in an organization. Used by the daily cron.
 */
export async function evaluateOrgGoals(organizationId: string): Promise<{ evaluated: number; goals: number }> {
  const goals = await getCohortGoalsByOrg(organizationId);
  let evaluated = 0;
  for (const goal of goals) {
    const result = await evaluateGoal(goal.id);
    evaluated += result.evaluated;
  }

  return { evaluated, goals: goals.length };
}

/**
 * Re-evaluate every active goal across every org. Designed for the daily cron
 * sweep — same shape as `runComplianceExpiryCheck` for the compliance feature.
 */
export async function runCohortGoalEvaluationSweep(): Promise<{
  goalsEvaluated: number;
  assignmentsEvaluated: number;
}> {
  const goals = await listAllActiveCohortGoals();
  let assignmentsEvaluated = 0;

  for (const goal of goals) {
    try {
      const result = await evaluateGoal(goal.id);
      assignmentsEvaluated += result.evaluated;
    } catch (error) {
      console.error(`runCohortGoalEvaluationSweep: failed to evaluate goal ${goal.id}`, error);
    }
  }

  return { goalsEvaluated: goals.length, assignmentsEvaluated };
}

// ─── Reminder scan ───────────────────────────────────────────────────────────

function getWholeDaysUntil(now: Date, target: Date): number {
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / DAY_MS);
}

/**
 * Scan all active goal assignments and send a reminder email when
 * `daysUntilDue` matches an entry in the goal's `reminderDaysBefore` cadence
 * (mirrors `runComplianceReminderScan`).
 *
 * Idempotency: the email worker idempotency key is keyed on assignment id +
 * the day bucket so a second run on the same day does not re-send.
 */
export async function runCohortGoalReminderScan(): Promise<{
  scanned: number;
  remindersEnqueued: number;
}> {
  const now = new Date();
  const rows = await listAssignmentsForReminderScan();

  let remindersEnqueued = 0;

  for (const row of rows) {
    if (!row.assignment.dueDate) continue;
    if (!row.email) continue;

    const dueDate = new Date(row.assignment.dueDate);
    if (Number.isNaN(dueDate.getTime())) continue;

    const daysUntilDue = getWholeDaysUntil(now, dueDate);
    const reminderDays = row.goal.reminderDaysBefore ?? [];
    const isOverdueDay = daysUntilDue === 0;
    const matchesReminder = (daysUntilDue > 0 && reminderDays.includes(daysUntilDue)) || isOverdueDay;

    if (!matchesReminder) continue;

    const loginUrl = getDashboardBaseUrl({
      siteName: row.organizationSiteName,
      customDomain: row.organizationCustomDomain,
      isCustomDomainVerified: row.organizationIsCustomDomainVerified
    });
    const dayKey = now.toISOString().slice(0, 10);

    try {
      await enqueueTransactionalEmail('cohortGoalReminder', {
        to: row.email,
        fields: {
          orgName: row.organizationName,
          cohortName: row.cohortName,
          goalTitle: row.goal.title,
          daysUntilDue,
          completedCount: row.assignment.completedCount ?? 0,
          requiredCount: row.assignment.requiredCount ?? 0,
          loginUrl: `${loginUrl}/lms/cohorts/${row.cohortId}`,
          branding: buildEmailBranding({
            name: row.organizationName,
            avatarUrl: row.organizationAvatarUrl,
            theme: row.organizationTheme
          })
        },
        idempotencyKey: `cohort-goal-reminder:${row.assignment.id}:${daysUntilDue}:${dayKey}`,
        preference: { organizationId: row.organizationId, recipientProfileId: row.profileId }
      });
      remindersEnqueued += 1;
    } catch (error) {
      console.error(`runCohortGoalReminderScan: enqueue failed for assignment ${row.assignment.id}`, error);
    }
  }

  return { scanned: rows.length, remindersEnqueued };
}

// ─── LMS read ────────────────────────────────────────────────────────────────

export async function getMyGoals(profileId: string) {
  return getAssignmentsForProfile(profileId);
}

// ─── Org-wide overview ───────────────────────────────────────────────────────

/**
 * Cross-cohort goal roll-up for the org owner. Lists every active goal in the
 * org with its per-status counts so the dashboard can group by cohort.
 */
export async function getOrgGoalsOverview(organizationId: string) {
  const goals = await getCohortGoalsByOrg(organizationId);
  if (goals.length === 0) {
    return { goals: [] };
  }

  const counts = await countAssignmentsByStatus(goals.map((goal) => goal.id));

  return {
    goals: goals.map((goal) => {
      const statusCounts = counts.get(goal.id) ?? {};
      const total = Object.values(statusCounts).reduce((sum, value) => sum + (value ?? 0), 0);
      const completed = statusCounts.completed ?? 0;
      const overdue = statusCounts.overdue ?? 0;
      const atRisk = statusCounts.at_risk ?? 0;
      const onTrack = total - overdue - atRisk;
      const onTrackPct = total === 0 ? 0 : Math.round((onTrack / total) * 100);

      return {
        goalId: goal.id,
        cohortId: goal.cohortId,
        cohortName: goal.cohortName,
        title: goal.title,
        type: goal.type,
        deadlineKind: goal.deadlineKind,
        totalLearners: total,
        completedCount: completed,
        inProgressCount: statusCounts.in_progress ?? 0,
        atRiskCount: atRisk,
        overdueCount: overdue,
        notStartedCount: statusCounts.not_started ?? 0,
        waivedCount: statusCounts.waived ?? 0,
        onTrackPct
      };
    })
  };
}
