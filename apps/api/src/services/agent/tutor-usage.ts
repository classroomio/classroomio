import {
  STUDENT_TUTOR_APPROACHING_THRESHOLD,
  STUDENT_TUTOR_MONTHLY_CAP,
  type AiTutorSettings
} from '@cio/ai-assistant/tutor-config';
import {
  getCapStatusSummary,
  getLearnerCapEvents,
  getLearnerCourseBreakdown,
  getLearnerDailyUsage,
  getLearnerLeaderboard,
  getMonthlyTutorCount,
  incrementMonthlyTutorCount,
  recordCapEvent
} from '@cio/db/queries/agent';

import { AppError } from '@api/utils/errors';
import { getEffectiveAiTutorSettings } from './tutor-config';
import { enforceTokenBalance } from '@cio/core/services/agent/usage';

export const STUDENT_TUTOR_CAP = STUDENT_TUTOR_MONTHLY_CAP;

/**
 * Whether per-learner cap enforcement is on for this environment.
 * Phase 1 ships with this off (instrumentation only); Phase 3 flips it on.
 */
export function isCapEnforced(): boolean {
  const raw = process.env.AI_TUTOR_CAP_ENFORCED;
  if (raw == null) return false;
  return raw === '1' || raw.toLowerCase() === 'true';
}

function startOfCurrentMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function startOfPreviousMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
}

function startOfLast90DaysUtc(): Date {
  const now = new Date();
  return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
}

export function resolveTutorPeriod(period: 'current' | 'previous' | 'last90'): { start: Date; end?: Date } {
  if (period === 'previous') {
    const start = startOfPreviousMonthUtc();
    const end = startOfCurrentMonthUtc();
    return { start, end };
  }

  if (period === 'last90') {
    return { start: startOfLast90DaysUtc() };
  }

  return { start: startOfCurrentMonthUtc() };
}

export interface TutorPolicyResult {
  settings: AiTutorSettings;
  messageCount: number;
  capRemaining: number;
}

/**
 * Order of checks (matches PRD §"Enforcement"):
 *   1. Workspace AI tutor toggle  (settings.enabled)
 *   2. Org pooled quota           (enforceTokenBalance)
 *   3. Per-learner monthly cap    (STUDENT_TUTOR_MONTHLY_CAP)
 *
 * Each failure logs a cap event so admins can see why a learner was blocked.
 * Cap enforcement is gated behind `AI_TUTOR_CAP_ENFORCED` for Phase 1 rollout.
 */
export async function enforceStudentTutorPolicy(
  orgId: string,
  courseId: string,
  userId: string
): Promise<TutorPolicyResult> {
  const settings = await getEffectiveAiTutorSettings(orgId, courseId);

  if (!settings.enabled) {
    await recordCapEvent({ orgId, userId, courseId, eventType: 'tutor_disabled' });
    throw new AppError('AI tutor is disabled for this workspace', 'AI_TUTOR_DISABLED', 403);
  }

  try {
    await enforceTokenBalance(orgId);
  } catch (error) {
    if (error instanceof AppError && error.code === 'TOKEN_LIMIT_REACHED') {
      await recordCapEvent({ orgId, userId, courseId, eventType: 'pool_exhausted' });
      throw new AppError('AI tutor is taking a break', 'POOL_EXHAUSTED', 429);
    }
    throw error;
  }

  const monthly = await getMonthlyTutorCount(orgId, userId, startOfCurrentMonthUtc());

  if (isCapEnforced() && monthly.messageCount >= STUDENT_TUTOR_CAP) {
    if (!monthly.capHitAt) {
      await recordCapEvent({ orgId, userId, courseId, eventType: 'cap_reached' });
    }
    throw new AppError('AI tutor is taking a break', 'LEARNER_CAP_REACHED', 429);
  }

  return {
    settings,
    messageCount: monthly.messageCount,
    capRemaining: Math.max(0, STUDENT_TUTOR_CAP - monthly.messageCount)
  };
}

export async function incrementStudentTutorCount(
  orgId: string,
  userId: string,
  courseId: string
): Promise<{ messageCount: number; capHit: boolean }> {
  const result = await incrementMonthlyTutorCount({
    orgId,
    userId,
    periodStart: startOfCurrentMonthUtc(),
    cap: STUDENT_TUTOR_CAP
  });

  if (result.capHit && isCapEnforced()) {
    await recordCapEvent({ orgId, userId, courseId, eventType: 'cap_reached' });
  }

  return result;
}

export async function getStudentTutorStatus(
  orgId: string,
  courseId: string,
  userId: string
): Promise<{ enabled: boolean; cap: number; capRemaining: number; enforced: boolean }> {
  const settings = await getEffectiveAiTutorSettings(orgId, courseId);
  const monthly = await getMonthlyTutorCount(orgId, userId, startOfCurrentMonthUtc());

  return {
    enabled: settings.enabled,
    cap: STUDENT_TUTOR_CAP,
    capRemaining: Math.max(0, STUDENT_TUTOR_CAP - monthly.messageCount),
    enforced: isCapEnforced()
  };
}

// ─── Admin reads (Fair-Use leaderboard + summary + per-learner detail) ───────

export interface AdminLeaderboardEntry {
  userId: string;
  fullname: string | null;
  email: string | null;
  avatarUrl: string | null;
  messageCount: number;
  tokens: number;
  capRemaining: number;
  capPct: number;
  status: 'under' | 'approaching' | 'at_cap';
  capHitAt: string | null;
  lastMessageAt: string | null;
}

export async function getTutorLearnerLeaderboard(
  orgId: string,
  params: {
    period: 'current' | 'previous' | 'last90';
    search?: string;
    sort?: 'messages' | 'tokens' | 'capPct';
    page?: number;
    limit?: number;
  }
): Promise<{ entries: AdminLeaderboardEntry[]; total: number; cap: number; periodStart: string }> {
  const { start, end } = resolveTutorPeriod(params.period);
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const { rows, total } = await getLearnerLeaderboard(orgId, {
    periodStart: start,
    periodEnd: end,
    search: params.search,
    sort: params.sort,
    limit,
    offset: (page - 1) * limit
  });

  const entries: AdminLeaderboardEntry[] = rows.map((row) => {
    const messageCount = row.messageCount;
    const capPct = messageCount / STUDENT_TUTOR_CAP;
    const status: AdminLeaderboardEntry['status'] =
      messageCount >= STUDENT_TUTOR_CAP
        ? 'at_cap'
        : capPct >= STUDENT_TUTOR_APPROACHING_THRESHOLD
          ? 'approaching'
          : 'under';

    return {
      userId: row.userId,
      fullname: row.fullname,
      email: row.email,
      avatarUrl: row.avatarUrl,
      messageCount,
      tokens: row.tokens,
      capRemaining: Math.max(0, STUDENT_TUTOR_CAP - messageCount),
      capPct,
      status,
      capHitAt: row.capHitAt,
      lastMessageAt: row.lastMessageAt
    };
  });

  return { entries, total, cap: STUDENT_TUTOR_CAP, periodStart: start.toISOString() };
}

export async function getTutorCapStatusSummary(
  orgId: string,
  period: 'current' | 'previous' | 'last90' = 'current'
): Promise<{ atCap: number; approaching: number; totalActive: number; cap: number; periodStart: string }> {
  const { start } = resolveTutorPeriod(period);
  const summary = await getCapStatusSummary(orgId, start, STUDENT_TUTOR_CAP, STUDENT_TUTOR_APPROACHING_THRESHOLD);

  return { ...summary, cap: STUDENT_TUTOR_CAP, periodStart: start.toISOString() };
}

export interface AdminLearnerDetail {
  userId: string;
  cap: number;
  messageCount: number;
  capRemaining: number;
  status: AdminLeaderboardEntry['status'];
  dailyUsage: { date: string; messages: number; tokens: number }[];
  courseBreakdown: { courseId: string; courseTitle: string | null; tokens: number; messages: number }[];
  capEvents: { id: number; eventType: string; occurredAt: string; courseId: string | null }[];
  periodStart: string;
}

export async function getTutorLearnerDetail(
  orgId: string,
  userId: string,
  period: 'current' | 'previous' | 'last90' = 'current'
): Promise<AdminLearnerDetail> {
  const { start } = resolveTutorPeriod(period);
  const monthly = await getMonthlyTutorCount(orgId, userId, start);
  const [dailyUsage, courseBreakdown, capEvents] = await Promise.all([
    getLearnerDailyUsage(orgId, userId, start),
    getLearnerCourseBreakdown(orgId, userId, start),
    getLearnerCapEvents(orgId, userId, start)
  ]);

  const capPct = monthly.messageCount / STUDENT_TUTOR_CAP;
  const status: AdminLeaderboardEntry['status'] =
    monthly.messageCount >= STUDENT_TUTOR_CAP
      ? 'at_cap'
      : capPct >= STUDENT_TUTOR_APPROACHING_THRESHOLD
        ? 'approaching'
        : 'under';

  return {
    userId,
    cap: STUDENT_TUTOR_CAP,
    messageCount: monthly.messageCount,
    capRemaining: Math.max(0, STUDENT_TUTOR_CAP - monthly.messageCount),
    status,
    dailyUsage,
    courseBreakdown,
    capEvents,
    periodStart: start.toISOString()
  };
}
