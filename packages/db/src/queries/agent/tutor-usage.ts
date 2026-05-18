import { and, asc, desc, eq, gte, lte, sql, ilike, or } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

/**
 * AI tutor usage queries — per-learner monthly message counts and cap events.
 *
 * The monthly counter is keyed by (orgId, userId, periodStart) and incremented
 * atomically via INSERT ... ON CONFLICT so concurrent requests cannot exceed
 * the cap.
 */

export interface MonthlyTutorCount {
  messageCount: number;
  capHitAt: string | null;
  lastMessageAt: string | null;
}

function periodStartString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export async function getMonthlyTutorCount(
  orgId: string,
  userId: string,
  periodStart: Date
): Promise<MonthlyTutorCount> {
  try {
    const period = periodStartString(periodStart);
    const [row] = await db
      .select({
        messageCount: schema.aiTutorMessageCount.messageCount,
        capHitAt: schema.aiTutorMessageCount.capHitAt,
        lastMessageAt: schema.aiTutorMessageCount.lastMessageAt
      })
      .from(schema.aiTutorMessageCount)
      .where(
        and(
          eq(schema.aiTutorMessageCount.orgId, orgId),
          eq(schema.aiTutorMessageCount.userId, userId),
          eq(schema.aiTutorMessageCount.periodStart, period)
        )
      )
      .limit(1);

    return {
      messageCount: row?.messageCount ?? 0,
      capHitAt: row?.capHitAt ?? null,
      lastMessageAt: row?.lastMessageAt ?? null
    };
  } catch (error) {
    console.error('getMonthlyTutorCount error:', error);
    throw new Error('Failed to fetch monthly tutor count');
  }
}

/**
 * Atomically increment the learner's monthly tutor counter and return the new
 * value. Uses INSERT ... ON CONFLICT so concurrent calls cannot race past the
 * cap.
 */
export async function incrementMonthlyTutorCount(params: {
  orgId: string;
  userId: string;
  periodStart: Date;
  cap: number;
}): Promise<{ messageCount: number; capHit: boolean }> {
  try {
    const period = periodStartString(params.periodStart);
    const now = new Date().toISOString();
    const [row] = await db
      .insert(schema.aiTutorMessageCount)
      .values({
        orgId: params.orgId,
        userId: params.userId,
        periodStart: period,
        messageCount: 1,
        lastMessageAt: now,
        capHitAt: null
      })
      .onConflictDoUpdate({
        target: [
          schema.aiTutorMessageCount.orgId,
          schema.aiTutorMessageCount.userId,
          schema.aiTutorMessageCount.periodStart
        ],
        set: {
          messageCount: sql`${schema.aiTutorMessageCount.messageCount} + 1`,
          lastMessageAt: now,
          updatedAt: now,
          capHitAt: sql`CASE
            WHEN ${schema.aiTutorMessageCount.capHitAt} IS NOT NULL THEN ${schema.aiTutorMessageCount.capHitAt}
            WHEN ${schema.aiTutorMessageCount.messageCount} + 1 >= ${params.cap} THEN ${now}
            ELSE NULL
          END`
        }
      })
      .returning({
        messageCount: schema.aiTutorMessageCount.messageCount,
        capHitAt: schema.aiTutorMessageCount.capHitAt
      });

    return {
      messageCount: row?.messageCount ?? 0,
      capHit: !!row?.capHitAt
    };
  } catch (error) {
    console.error('incrementMonthlyTutorCount error:', error);
    throw new Error('Failed to increment tutor counter');
  }
}

export async function recordCapEvent(params: {
  orgId: string;
  userId: string;
  courseId?: string;
  eventType: 'cap_reached' | 'pool_exhausted' | 'tutor_disabled';
}): Promise<void> {
  try {
    await db.insert(schema.aiTutorCapEvent).values({
      orgId: params.orgId,
      userId: params.userId,
      courseId: params.courseId,
      eventType: params.eventType
    });
  } catch (error) {
    console.error('recordCapEvent error:', error);
  }
}

export interface LearnerLeaderboardRow {
  userId: string;
  fullname: string | null;
  email: string | null;
  avatarUrl: string | null;
  messageCount: number;
  tokens: number;
  capHitAt: string | null;
  lastMessageAt: string | null;
}

export interface LearnerLeaderboardOptions {
  periodStart: Date;
  periodEnd?: Date;
  search?: string;
  sort?: 'messages' | 'tokens' | 'capPct';
  limit?: number;
  offset?: number;
}

/**
 * Learners ranked by tutor activity in the given period.
 * Joins the monthly counter (the canonical message count) with aggregated
 * ai_token_usage (for per-learner token totals) and profile (for display).
 */
export async function getLearnerLeaderboard(
  orgId: string,
  options: LearnerLeaderboardOptions
): Promise<{ rows: LearnerLeaderboardRow[]; total: number }> {
  try {
    const period = periodStartString(options.periodStart);
    const periodEndStr = options.periodEnd ? periodStartString(options.periodEnd) : period;
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const search = options.search?.trim();

    const tokenSubquery = db
      .select({
        userId: schema.aiTokenUsage.userId,
        tokens:
          sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`.as(
            'tokens'
          )
      })
      .from(schema.aiTokenUsage)
      .where(
        and(
          eq(schema.aiTokenUsage.orgId, orgId),
          gte(schema.aiTokenUsage.createdAt, options.periodStart.toISOString()),
          options.periodEnd ? lte(schema.aiTokenUsage.createdAt, options.periodEnd.toISOString()) : undefined
        )
      )
      .groupBy(schema.aiTokenUsage.userId)
      .as('tokens_by_user');

    const whereClause = and(
      eq(schema.aiTutorMessageCount.orgId, orgId),
      options.periodEnd
        ? and(
            gte(schema.aiTutorMessageCount.periodStart, period),
            lte(schema.aiTutorMessageCount.periodStart, periodEndStr)
          )
        : eq(schema.aiTutorMessageCount.periodStart, period),
      search ? or(ilike(schema.profile.fullname, `%${search}%`), ilike(schema.profile.email, `%${search}%`)) : undefined
    );

    const orderExpr =
      options.sort === 'tokens'
        ? desc(tokenSubquery.tokens)
        : options.sort === 'capPct'
          ? desc(schema.aiTutorMessageCount.messageCount)
          : desc(schema.aiTutorMessageCount.messageCount);

    const rows = await db
      .select({
        userId: schema.aiTutorMessageCount.userId,
        fullname: schema.profile.fullname,
        email: schema.profile.email,
        avatarUrl: schema.profile.avatarUrl,
        messageCount: schema.aiTutorMessageCount.messageCount,
        tokens: sql<number>`COALESCE(${tokenSubquery.tokens}, 0)`,
        capHitAt: schema.aiTutorMessageCount.capHitAt,
        lastMessageAt: schema.aiTutorMessageCount.lastMessageAt
      })
      .from(schema.aiTutorMessageCount)
      .leftJoin(schema.profile, eq(schema.profile.id, schema.aiTutorMessageCount.userId))
      .leftJoin(tokenSubquery, eq(tokenSubquery.userId, schema.aiTutorMessageCount.userId))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(schema.aiTutorMessageCount)
      .leftJoin(schema.profile, eq(schema.profile.id, schema.aiTutorMessageCount.userId))
      .where(whereClause);

    return {
      rows: rows.map((row) => ({
        userId: row.userId,
        fullname: row.fullname,
        email: row.email,
        avatarUrl: row.avatarUrl,
        messageCount: Number(row.messageCount ?? 0),
        tokens: Number(row.tokens ?? 0),
        capHitAt: row.capHitAt,
        lastMessageAt: row.lastMessageAt
      })),
      total: Number(total ?? 0)
    };
  } catch (error) {
    console.error('getLearnerLeaderboard error:', error);
    throw new Error('Failed to fetch learner leaderboard');
  }
}

export interface CapStatusSummary {
  atCap: number;
  approaching: number;
  totalActive: number;
}

export async function getCapStatusSummary(
  orgId: string,
  periodStart: Date,
  cap: number,
  approachingThreshold: number
): Promise<CapStatusSummary> {
  try {
    const period = periodStartString(periodStart);
    const approachingFloor = Math.ceil(cap * approachingThreshold);

    const [row] = await db
      .select({
        totalActive: sql<number>`COUNT(*)`,
        atCap: sql<number>`COUNT(*) FILTER (WHERE ${schema.aiTutorMessageCount.messageCount} >= ${cap})`,
        approaching: sql<number>`COUNT(*) FILTER (WHERE ${schema.aiTutorMessageCount.messageCount} >= ${approachingFloor} AND ${schema.aiTutorMessageCount.messageCount} < ${cap})`
      })
      .from(schema.aiTutorMessageCount)
      .where(and(eq(schema.aiTutorMessageCount.orgId, orgId), eq(schema.aiTutorMessageCount.periodStart, period)));

    return {
      totalActive: Number(row?.totalActive ?? 0),
      atCap: Number(row?.atCap ?? 0),
      approaching: Number(row?.approaching ?? 0)
    };
  } catch (error) {
    console.error('getCapStatusSummary error:', error);
    throw new Error('Failed to fetch cap status summary');
  }
}

export interface LearnerDailyUsage {
  date: string;
  messages: number;
  tokens: number;
}

export async function getLearnerDailyUsage(orgId: string, userId: string, since: Date): Promise<LearnerDailyUsage[]> {
  try {
    const rows = await db
      .select({
        date: sql<string>`DATE(${schema.aiTokenUsage.createdAt})`,
        tokens: sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`,
        messages: sql<number>`COUNT(*)`
      })
      .from(schema.aiTokenUsage)
      .where(
        and(
          eq(schema.aiTokenUsage.orgId, orgId),
          eq(schema.aiTokenUsage.userId, userId),
          gte(schema.aiTokenUsage.createdAt, since.toISOString())
        )
      )
      .groupBy(sql`DATE(${schema.aiTokenUsage.createdAt})`)
      .orderBy(asc(sql`DATE(${schema.aiTokenUsage.createdAt})`));

    return rows.map((row) => ({
      date: String(row.date),
      tokens: Number(row.tokens),
      messages: Number(row.messages)
    }));
  } catch (error) {
    console.error('getLearnerDailyUsage error:', error);
    throw new Error('Failed to fetch learner daily usage');
  }
}

export interface LearnerCourseBreakdown {
  courseId: string;
  courseTitle: string | null;
  tokens: number;
  messages: number;
}

export async function getLearnerCourseBreakdown(
  orgId: string,
  userId: string,
  since: Date
): Promise<LearnerCourseBreakdown[]> {
  try {
    const rows = await db
      .select({
        courseId: schema.aiTokenUsage.courseId,
        courseTitle: schema.course.title,
        tokens: sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`,
        messages: sql<number>`COUNT(*)`
      })
      .from(schema.aiTokenUsage)
      .leftJoin(schema.course, eq(schema.course.id, schema.aiTokenUsage.courseId))
      .where(
        and(
          eq(schema.aiTokenUsage.orgId, orgId),
          eq(schema.aiTokenUsage.userId, userId),
          gte(schema.aiTokenUsage.createdAt, since.toISOString())
        )
      )
      .groupBy(schema.aiTokenUsage.courseId, schema.course.title)
      .orderBy(
        desc(
          sql`SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens}))`
        )
      );

    return rows.map((row) => ({
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      tokens: Number(row.tokens),
      messages: Number(row.messages)
    }));
  } catch (error) {
    console.error('getLearnerCourseBreakdown error:', error);
    throw new Error('Failed to fetch learner course breakdown');
  }
}

export interface LearnerCapEvent {
  id: number;
  eventType: string;
  occurredAt: string;
  courseId: string | null;
}

export async function getLearnerCapEvents(
  orgId: string,
  userId: string,
  since: Date,
  limit = 50
): Promise<LearnerCapEvent[]> {
  try {
    const rows = await db
      .select({
        id: schema.aiTutorCapEvent.id,
        eventType: schema.aiTutorCapEvent.eventType,
        occurredAt: schema.aiTutorCapEvent.occurredAt,
        courseId: schema.aiTutorCapEvent.courseId
      })
      .from(schema.aiTutorCapEvent)
      .where(
        and(
          eq(schema.aiTutorCapEvent.orgId, orgId),
          eq(schema.aiTutorCapEvent.userId, userId),
          gte(schema.aiTutorCapEvent.occurredAt, since.toISOString())
        )
      )
      .orderBy(desc(schema.aiTutorCapEvent.occurredAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      occurredAt: row.occurredAt,
      courseId: row.courseId
    }));
  } catch (error) {
    console.error('getLearnerCapEvents error:', error);
    throw new Error('Failed to fetch learner cap events');
  }
}
