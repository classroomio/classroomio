import * as schema from '@db/schema';

import { and, count, desc, eq, gte, inArray, lte, notInArray, sql, type SQL } from 'drizzle-orm';

import type { TLiveSessionReminderSkipReason, TLiveSessionReminderStatus } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

const UPSERT_CHUNK_SIZE = 500;

const REOPENABLE_SKIP_REASONS: TLiveSessionReminderSkipReason[] = ['lesson_rescheduled', 'offset_removed'];

export type PendingReminderDeliveryInput = {
  organizationId: string;
  courseId: string;
  lessonId: string;
  profileId: string;
  offsetMinutes: number;
  lessonAt: string;
};

/**
 * Inserts a pending row per (lesson, student, offset). An existing row is reset to pending when its lesson moved to
 * a new time, or when it was skipped because of a reschedule or a removed offset; every other row is left alone.
 */
export async function upsertPendingReminderDeliveries(rows: PendingReminderDeliveryInput[]): Promise<void> {
  try {
    const target = schema.liveSessionReminderDelivery;
    const reopenableReasons = sql.join(
      REOPENABLE_SKIP_REASONS.map((reason) => sql`${reason}`),
      sql`, `
    );

    for (let start = 0; start < rows.length; start += UPSERT_CHUNK_SIZE) {
      const chunk = rows.slice(start, start + UPSERT_CHUNK_SIZE);

      await db
        .insert(target)
        .values(chunk)
        .onConflictDoUpdate({
          target: [target.lessonId, target.profileId, target.offsetMinutes],
          set: {
            lessonAt: sql`excluded.lesson_at`,
            status: 'pending',
            skipReason: null,
            bullmqJobId: null,
            providerId: null,
            lastError: null,
            attemptCount: 0,
            queuedAt: null,
            sentAt: null,
            updatedAt: sql`now()`
          },
          setWhere: sql`${target.lessonAt} <> excluded.lesson_at OR (${target.status} = 'skipped' AND ${target.skipReason} IN (${reopenableReasons}))`
        });
    }
  } catch (error) {
    console.error('upsertPendingReminderDeliveries error:', error);
    throw new Error('Failed to upsert pending live session reminder deliveries');
  }
}

/**
 * Pending reminder rows for the given lessons.
 */
export async function listPendingReminderDeliveries(lessonIds: string[]) {
  try {
    if (lessonIds.length === 0) return [];

    return await db
      .select({
        id: schema.liveSessionReminderDelivery.id,
        lessonId: schema.liveSessionReminderDelivery.lessonId,
        profileId: schema.liveSessionReminderDelivery.profileId,
        offsetMinutes: schema.liveSessionReminderDelivery.offsetMinutes,
        lessonAt: schema.liveSessionReminderDelivery.lessonAt
      })
      .from(schema.liveSessionReminderDelivery)
      .where(
        and(
          inArray(schema.liveSessionReminderDelivery.lessonId, lessonIds),
          eq(schema.liveSessionReminderDelivery.status, 'pending')
        )
      );
  } catch (error) {
    console.error('listPendingReminderDeliveries error:', error);
    throw new Error('Failed to list pending live session reminder deliveries');
  }
}

/**
 * Claims a pending row for sending the given session snapshot. Returns false when another scan already claimed it,
 * it is no longer pending, or the lesson's time or join link no longer match the snapshot.
 */
export async function markReminderDeliveryQueued(params: {
  deliveryId: string;
  bullmqJobId: string;
  lessonAt: string;
  callUrl: string;
}): Promise<boolean> {
  try {
    const delivery = schema.liveSessionReminderDelivery;
    const lessonMatchesSnapshot = sql`exists (
      select 1 from ${schema.lesson}
      where ${schema.lesson.id} = ${delivery.lessonId}
        and ${schema.lesson.lessonAt} = ${delivery.lessonAt}
        and ${schema.lesson.lessonAt} = ${params.lessonAt}::timestamptz
        and ${schema.lesson.callUrl} = ${params.callUrl}
    )`;

    const claimed = await db
      .update(delivery)
      .set({ status: 'queued', bullmqJobId: params.bullmqJobId, queuedAt: sql`now()`, updatedAt: sql`now()` })
      .where(and(eq(delivery.id, params.deliveryId), eq(delivery.status, 'pending'), lessonMatchesSnapshot))
      .returning({ id: delivery.id });

    return claimed.length > 0;
  } catch (error) {
    console.error('markReminderDeliveryQueued error:', error);
    throw new Error('Failed to mark live session reminder delivery queued');
  }
}

/**
 * Returns a row claimed by `bullmqJobId` to pending, e.g. after its email job could not be enqueued.
 */
export async function releaseReminderDeliveryClaim(params: {
  deliveryId: string;
  bullmqJobId: string;
  lastError: string;
}): Promise<void> {
  try {
    await db
      .update(schema.liveSessionReminderDelivery)
      .set({ status: 'pending', bullmqJobId: null, queuedAt: null, lastError: params.lastError, updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.id, params.deliveryId),
          eq(schema.liveSessionReminderDelivery.bullmqJobId, params.bullmqJobId),
          eq(schema.liveSessionReminderDelivery.status, 'queued')
        )
      );
  } catch (error) {
    console.error('releaseReminderDeliveryClaim error:', error);
    throw new Error('Failed to release live session reminder delivery claim');
  }
}

/**
 * Queued rows claimed before `queuedBeforeIso`, oldest first.
 */
export async function listStaleQueuedReminderDeliveries(queuedBeforeIso: string, limit: number) {
  try {
    return await db
      .select({
        id: schema.liveSessionReminderDelivery.id,
        bullmqJobId: schema.liveSessionReminderDelivery.bullmqJobId
      })
      .from(schema.liveSessionReminderDelivery)
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.status, 'queued'),
          lte(schema.liveSessionReminderDelivery.queuedAt, queuedBeforeIso)
        )
      )
      .orderBy(schema.liveSessionReminderDelivery.queuedAt)
      .limit(limit);
  } catch (error) {
    console.error('listStaleQueuedReminderDeliveries error:', error);
    throw new Error('Failed to list stale queued live session reminder deliveries');
  }
}

/**
 * Records the outcome of an email that was sent outside a ledger claim, for a row that is still pending.
 */
export async function settlePendingReminderDelivery(params: {
  deliveryId: string;
  outcome: 'sent' | 'failed';
  providerId?: string | null;
  lastError?: string | null;
}): Promise<void> {
  try {
    const sentAt = params.outcome === 'sent' ? sql`now()` : null;

    await db
      .update(schema.liveSessionReminderDelivery)
      .set({
        status: params.outcome,
        providerId: params.providerId || null,
        lastError: params.lastError ?? null,
        sentAt,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.id, params.deliveryId),
          eq(schema.liveSessionReminderDelivery.status, 'pending')
        )
      );
  } catch (error) {
    console.error('settlePendingReminderDelivery error:', error);
    throw new Error('Failed to settle live session reminder delivery');
  }
}

export async function markReminderDeliveriesSkipped(
  deliveryIds: string[],
  skipReason: TLiveSessionReminderSkipReason
): Promise<void> {
  try {
    if (deliveryIds.length === 0) return;

    await db
      .update(schema.liveSessionReminderDelivery)
      .set({ status: 'skipped', skipReason, updatedAt: sql`now()` })
      .where(
        and(
          inArray(schema.liveSessionReminderDelivery.id, deliveryIds),
          eq(schema.liveSessionReminderDelivery.status, 'pending')
        )
      );
  } catch (error) {
    console.error('markReminderDeliveriesSkipped error:', error);
    throw new Error('Failed to mark live session reminder deliveries skipped');
  }
}

/**
 * Whether the email job `bullmqJobId` still owns this delivery row and may send it.
 */
export async function isReminderDeliveryClaimedBy(deliveryId: string, bullmqJobId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.liveSessionReminderDelivery.id })
      .from(schema.liveSessionReminderDelivery)
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.id, deliveryId),
          eq(schema.liveSessionReminderDelivery.status, 'queued'),
          eq(schema.liveSessionReminderDelivery.bullmqJobId, bullmqJobId)
        )
      )
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('isReminderDeliveryClaimedBy error:', error);
    throw new Error('Failed to read live session reminder delivery claim');
  }
}

export async function markReminderDeliverySent(deliveryId: string, bullmqJobId: string, providerId: string) {
  try {
    await db
      .update(schema.liveSessionReminderDelivery)
      .set({
        status: 'sent',
        providerId: providerId || null,
        lastError: null,
        attemptCount: sql`${schema.liveSessionReminderDelivery.attemptCount} + 1`,
        sentAt: sql`now()`,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.id, deliveryId),
          eq(schema.liveSessionReminderDelivery.bullmqJobId, bullmqJobId)
        )
      );
  } catch (error) {
    console.error('markReminderDeliverySent error:', error);
    throw new Error('Failed to mark live session reminder delivery sent');
  }
}

/**
 * Records one failed send attempt. The row becomes `failed` only once the worker has no retries left.
 */
export async function recordReminderDeliveryFailure(params: {
  deliveryId: string;
  bullmqJobId: string;
  lastError: string;
  isFinalAttempt: boolean;
}): Promise<void> {
  try {
    await db
      .update(schema.liveSessionReminderDelivery)
      .set({
        ...(params.isFinalAttempt ? { status: 'failed' as const } : {}),
        lastError: params.lastError,
        attemptCount: sql`${schema.liveSessionReminderDelivery.attemptCount} + 1`,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.id, params.deliveryId),
          eq(schema.liveSessionReminderDelivery.bullmqJobId, params.bullmqJobId),
          eq(schema.liveSessionReminderDelivery.status, 'queued')
        )
      );
  } catch (error) {
    console.error('recordReminderDeliveryFailure error:', error);
    throw new Error('Failed to record live session reminder delivery failure');
  }
}

/**
 * Skips every pending or queued reminder for a lesson, e.g. after it moved to a new time or call link.
 */
export async function skipActiveReminderDeliveriesForLesson(
  lessonId: string,
  skipReason: TLiveSessionReminderSkipReason,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.liveSessionReminderDelivery)
      .set({ status: 'skipped', skipReason, updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.lessonId, lessonId),
          inArray(schema.liveSessionReminderDelivery.status, ['pending', 'queued'])
        )
      );
  } catch (error) {
    console.error('skipActiveReminderDeliveriesForLesson error:', error);
    throw new Error('Failed to skip live session reminder deliveries for lesson');
  }
}

/**
 * Skips a course's pending reminders whose offset is no longer in `keptOffsetsMinutes`.
 */
export async function skipRemovedOffsetReminderDeliveries(
  courseId: string,
  keptOffsetsMinutes: number[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    const removedOffsetFilter =
      keptOffsetsMinutes.length > 0
        ? notInArray(schema.liveSessionReminderDelivery.offsetMinutes, keptOffsetsMinutes)
        : undefined;

    await dbClient
      .update(schema.liveSessionReminderDelivery)
      .set({ status: 'skipped', skipReason: 'offset_removed', updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.courseId, courseId),
          eq(schema.liveSessionReminderDelivery.status, 'pending'),
          removedOffsetFilter
        )
      );
  } catch (error) {
    console.error('skipRemovedOffsetReminderDeliveries error:', error);
    throw new Error('Failed to skip removed live session reminder offsets');
  }
}

/**
 * Skips pending reminders whose session already started.
 */
export async function skipPastPendingReminderDeliveries(nowIso: string): Promise<void> {
  try {
    await db
      .update(schema.liveSessionReminderDelivery)
      .set({ status: 'skipped', skipReason: 'lesson_past', updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.liveSessionReminderDelivery.status, 'pending'),
          lte(schema.liveSessionReminderDelivery.lessonAt, nowIso)
        )
      );
  } catch (error) {
    console.error('skipPastPendingReminderDeliveries error:', error);
    throw new Error('Failed to skip past live session reminder deliveries');
  }
}

/**
 * One page of a course's reminder deliveries for sessions since `sinceIso`, newest session first.
 */
export async function listReminderDeliveriesByCourse(params: {
  courseId: string;
  sinceIso: string;
  page: number;
  limit: number;
  status?: TLiveSessionReminderStatus;
  lessonId?: string;
}) {
  try {
    const filters: SQL[] = [
      eq(schema.liveSessionReminderDelivery.courseId, params.courseId),
      gte(schema.liveSessionReminderDelivery.lessonAt, params.sinceIso)
    ];
    if (params.status) filters.push(eq(schema.liveSessionReminderDelivery.status, params.status));
    if (params.lessonId) filters.push(eq(schema.liveSessionReminderDelivery.lessonId, params.lessonId));

    const where = and(...filters);
    const offset = (params.page - 1) * params.limit;

    const [items, [totals]] = await Promise.all([
      db
        .select({
          id: schema.liveSessionReminderDelivery.id,
          lessonId: schema.liveSessionReminderDelivery.lessonId,
          lessonTitle: schema.lesson.title,
          lessonAt: schema.liveSessionReminderDelivery.lessonAt,
          profileId: schema.liveSessionReminderDelivery.profileId,
          studentName: schema.profile.fullname,
          offsetMinutes: schema.liveSessionReminderDelivery.offsetMinutes,
          status: schema.liveSessionReminderDelivery.status,
          skipReason: schema.liveSessionReminderDelivery.skipReason,
          lastError: schema.liveSessionReminderDelivery.lastError,
          attemptCount: schema.liveSessionReminderDelivery.attemptCount,
          queuedAt: schema.liveSessionReminderDelivery.queuedAt,
          sentAt: schema.liveSessionReminderDelivery.sentAt,
          updatedAt: schema.liveSessionReminderDelivery.updatedAt
        })
        .from(schema.liveSessionReminderDelivery)
        .innerJoin(schema.lesson, eq(schema.liveSessionReminderDelivery.lessonId, schema.lesson.id))
        .innerJoin(schema.profile, eq(schema.liveSessionReminderDelivery.profileId, schema.profile.id))
        .where(where)
        .orderBy(
          desc(schema.liveSessionReminderDelivery.lessonAt),
          desc(schema.liveSessionReminderDelivery.offsetMinutes),
          schema.profile.fullname,
          schema.liveSessionReminderDelivery.id
        )
        .limit(params.limit)
        .offset(offset),
      db.select({ total: count() }).from(schema.liveSessionReminderDelivery).where(where)
    ]);

    return { items, total: totals?.total ?? 0 };
  } catch (error) {
    console.error('listReminderDeliveriesByCourse error:', error);
    throw new Error('Failed to list live session reminder deliveries');
  }
}
