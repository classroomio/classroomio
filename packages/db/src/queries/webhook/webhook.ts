import * as schema from '@db/schema';

import type {
  TNewWebhookDelivery,
  TNewWebhookEndpoint,
  TNewWebhookEvent,
  TWebhookDelivery,
  TWebhookEndpoint,
  TWebhookEvent
} from '@db/types';
import { and, count, desc, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { db, type DbOrTxClient, type TxClient } from '@db/drizzle';
import { WEBHOOK_DEGRADED_FAILURE_THRESHOLD } from '@cio/utils/constants/webhook';

export type TWebhookEndpointWithEvents = TWebhookEndpoint & { eventTypes: string[] };

export type TWebhookEventContext = {
  profiles: Map<string, { name: string | null; email: string | null; externalId: string | null }>;
  course: {
    id: string;
    title: string | null;
    slug: string | null;
    type: string | null;
    isPublished: boolean | null;
    cost: number | null;
    currency: string | null;
    tags: string[];
  } | null;
  statusLabels: Map<number, string>;
  exercise: { id: string; title: string | null } | null;
  lesson: { id: string; title: string | null } | null;
};

export type TWebhookEventContextInput = {
  organizationId?: string;
  profileIds: string[];
  statusIds?: number[];
  courseId?: string;
  exerciseId?: string;
  lessonId?: string;
};

export type TWebhookHealthTransition = 'degraded' | 'disabled' | null;

export type TWebhookDeliveryRecord = {
  delivery: TWebhookDelivery;
  event: TWebhookEvent;
};

export type TWebhookAttemptResult = {
  success: boolean;
  attempt: number;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number;
  requestHeaders: Record<string, string>;
  nextAttemptAt: Date | null;
  failureThreshold: number;
};

async function attachEventTypes(
  endpoints: TWebhookEndpoint[],
  client: DbOrTxClient
): Promise<TWebhookEndpointWithEvents[]> {
  if (endpoints.length === 0) return [];

  const subscriptions = await client
    .select()
    .from(schema.webhookSubscription)
    .where(
      inArray(
        schema.webhookSubscription.webhookId,
        endpoints.map((endpoint) => endpoint.id)
      )
    );

  return endpoints.map((endpoint) => ({
    ...endpoint,
    eventTypes: subscriptions
      .filter((subscription) => subscription.webhookId === endpoint.id)
      .map((subscription) => subscription.eventType)
  }));
}

async function replaceSubscriptions(webhookId: string, eventTypes: string[], client: DbOrTxClient) {
  await client.delete(schema.webhookSubscription).where(eq(schema.webhookSubscription.webhookId, webhookId));

  if (eventTypes.length === 0) return;

  await client
    .insert(schema.webhookSubscription)
    .values(eventTypes.map((eventType) => ({ webhookId, eventType })))
    .onConflictDoNothing();
}

export async function createWebhookEndpoint(
  values: TNewWebhookEndpoint,
  eventTypes: string[],
  client?: DbOrTxClient
): Promise<TWebhookEndpointWithEvents> {
  const run = async (tx: DbOrTxClient) => {
    const [created] = await tx.insert(schema.webhookEndpoint).values(values).returning();

    if (!created) {
      throw new Error('Failed to create webhook endpoint');
    }

    await replaceSubscriptions(created.id, eventTypes, tx);

    return { ...created, eventTypes };
  };

  try {
    return client ? await run(client) : await db.transaction((tx) => run(tx));
  } catch (error) {
    console.error('createWebhookEndpoint error:', error);
    throw new Error('Failed to create webhook endpoint');
  }
}

/**
 * Creates the endpoint only while the organization is under `maxEndpoints`, counting and inserting under
 * a row lock on the organization so concurrent creates cannot exceed the cap. Returns null when at the cap.
 */
export async function createWebhookEndpointWithinLimit(
  values: TNewWebhookEndpoint,
  eventTypes: string[],
  maxEndpoints: number
): Promise<TWebhookEndpointWithEvents | null> {
  try {
    return await db.transaction(async (tx) => {
      await tx
        .select({ id: schema.organization.id })
        .from(schema.organization)
        .where(eq(schema.organization.id, values.organizationId))
        .for('update');

      const existing = await countWebhookEndpoints(values.organizationId, tx);

      if (existing >= maxEndpoints) return null;

      return createWebhookEndpoint(values, eventTypes, tx);
    });
  } catch (error) {
    console.error('createWebhookEndpointWithinLimit error:', error);
    throw new Error('Failed to create webhook endpoint');
  }
}

export async function updateWebhookEndpoint(
  organizationId: string,
  webhookId: string,
  values: Partial<TNewWebhookEndpoint>,
  eventTypes?: string[],
  client?: DbOrTxClient
): Promise<TWebhookEndpointWithEvents | null> {
  const run = async (tx: DbOrTxClient) => {
    const [updated] = await tx
      .update(schema.webhookEndpoint)
      .set({ ...values, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.webhookEndpoint.id, webhookId), eq(schema.webhookEndpoint.organizationId, organizationId)))
      .returning();

    if (!updated) return null;

    if (eventTypes) {
      await replaceSubscriptions(updated.id, eventTypes, tx);
    }

    const [withEvents] = await attachEventTypes([updated], tx);

    return withEvents ?? null;
  };

  try {
    return client ? await run(client) : await db.transaction((tx) => run(tx));
  } catch (error) {
    console.error('updateWebhookEndpoint error:', error);
    throw new Error('Failed to update webhook endpoint');
  }
}

export async function deleteWebhookEndpoint(organizationId: string, webhookId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(schema.webhookEndpoint)
      .where(and(eq(schema.webhookEndpoint.id, webhookId), eq(schema.webhookEndpoint.organizationId, organizationId)))
      .returning({ id: schema.webhookEndpoint.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('deleteWebhookEndpoint error:', error);
    throw new Error('Failed to delete webhook endpoint');
  }
}

export async function getWebhookEndpoint(
  organizationId: string,
  webhookId: string,
  client: DbOrTxClient = db
): Promise<TWebhookEndpointWithEvents | null> {
  try {
    const [endpoint] = await client
      .select()
      .from(schema.webhookEndpoint)
      .where(and(eq(schema.webhookEndpoint.id, webhookId), eq(schema.webhookEndpoint.organizationId, organizationId)))
      .limit(1);

    if (!endpoint) return null;

    const [withEvents] = await attachEventTypes([endpoint], client);

    return withEvents ?? null;
  } catch (error) {
    console.error('getWebhookEndpoint error:', error);
    throw new Error('Failed to load webhook endpoint');
  }
}

export async function getWebhookEndpointById(
  webhookId: string,
  client: DbOrTxClient = db
): Promise<TWebhookEndpoint | null> {
  try {
    const [endpoint] = await client
      .select()
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.id, webhookId))
      .limit(1);

    return endpoint ?? null;
  } catch (error) {
    console.error('getWebhookEndpointById error:', error);
    throw new Error('Failed to load webhook endpoint');
  }
}

export async function listWebhookEndpoints(organizationId: string): Promise<TWebhookEndpointWithEvents[]> {
  try {
    const endpoints = await db
      .select()
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.organizationId, organizationId))
      .orderBy(desc(schema.webhookEndpoint.createdAt));

    return attachEventTypes(endpoints, db);
  } catch (error) {
    console.error('listWebhookEndpoints error:', error);
    throw new Error('Failed to list webhook endpoints');
  }
}

export type TWebhookDeliveryStats = { total: number; failed: number };

/**
 * Counts non-test deliveries created since `sinceIso` per endpoint. A delivery counts as failed when it
 * has gave up or is waiting to retry after a failed attempt.
 */
export async function getWebhookDeliveryStats(
  webhookIds: string[],
  sinceIso: string,
  client: DbOrTxClient = db
): Promise<Map<string, TWebhookDeliveryStats>> {
  if (webhookIds.length === 0) return new Map();

  try {
    const rows = await client
      .select({
        webhookId: schema.webhookDelivery.webhookId,
        total: count(),
        failed: sql<number>`count(*) filter (where ${schema.webhookDelivery.status} in ('FAILED', 'GAVE_UP') or (${schema.webhookDelivery.status} = 'PENDING' and ${schema.webhookDelivery.attempt} > 0))`
      })
      .from(schema.webhookDelivery)
      .where(
        and(
          inArray(schema.webhookDelivery.webhookId, webhookIds),
          eq(schema.webhookDelivery.isTest, false),
          gte(schema.webhookDelivery.createdAt, sinceIso)
        )
      )
      .groupBy(schema.webhookDelivery.webhookId);

    return new Map(rows.map((row) => [row.webhookId, { total: Number(row.total), failed: Number(row.failed) }]));
  } catch (error) {
    console.error('getWebhookDeliveryStats error:', error);
    throw new Error('Failed to load webhook delivery stats');
  }
}

export async function countWebhookEndpoints(organizationId: string, client: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await client
      .select({ total: count() })
      .from(schema.webhookEndpoint)
      .where(eq(schema.webhookEndpoint.organizationId, organizationId));

    return row?.total ?? 0;
  } catch (error) {
    console.error('countWebhookEndpoints error:', error);
    throw new Error('Failed to count webhook endpoints');
  }
}

export async function orgHasActiveWebhookEndpoint(organizationId: string, client: DbOrTxClient = db): Promise<boolean> {
  try {
    const [row] = await client
      .select({ id: schema.webhookEndpoint.id })
      .from(schema.webhookEndpoint)
      .where(and(eq(schema.webhookEndpoint.organizationId, organizationId), eq(schema.webhookEndpoint.isActive, true)))
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('orgHasActiveWebhookEndpoint error:', error);
    throw new Error('Failed to check for active webhook endpoints');
  }
}

/**
 * Reads the names and titles an event payload shows next to its ids. Anything that no longer exists
 * is returned as missing instead of failing.
 */
export async function getWebhookEventContext(
  input: TWebhookEventContextInput,
  client: DbOrTxClient = db
): Promise<TWebhookEventContext> {
  try {
    const statusIds = input.statusIds ?? [];
    const [profileResult, externalIdResult, courseResult, tagResult, statusResult, exerciseResult, lessonResult] =
      await Promise.allSettled([
        input.profileIds.length > 0
          ? client
              .select({ id: schema.profile.id, name: schema.profile.fullname, email: schema.profile.email })
              .from(schema.profile)
              .where(inArray(schema.profile.id, input.profileIds))
          : [],
        input.organizationId && input.profileIds.length > 0
          ? client
              .select({ profileId: schema.account.userId, externalId: schema.account.accountId })
              .from(schema.account)
              .innerJoin(
                schema.organizationSsoConfig,
                eq(schema.organizationSsoConfig.betterAuthProviderId, schema.account.providerId)
              )
              .where(
                and(
                  eq(schema.organizationSsoConfig.organizationId, input.organizationId),
                  inArray(schema.account.userId, input.profileIds)
                )
              )
          : [],
        input.courseId
          ? client
              .select({
                id: schema.course.id,
                title: schema.course.title,
                slug: schema.course.slug,
                type: schema.course.type,
                isPublished: schema.course.isPublished,
                cost: schema.course.cost,
                currency: schema.course.currency
              })
              .from(schema.course)
              .where(eq(schema.course.id, input.courseId))
              .limit(1)
          : [],
        input.courseId
          ? client
              .select({ name: schema.tag.name })
              .from(schema.tagAssignment)
              .innerJoin(schema.tag, eq(schema.tag.id, schema.tagAssignment.tagId))
              .where(eq(schema.tagAssignment.courseId, input.courseId))
          : [],
        statusIds.length > 0
          ? client
              .select({ id: schema.submissionstatus.id, label: schema.submissionstatus.label })
              .from(schema.submissionstatus)
              .where(inArray(schema.submissionstatus.id, statusIds))
          : [],
        input.exerciseId
          ? client
              .select({ id: schema.exercise.id, title: schema.exercise.title })
              .from(schema.exercise)
              .where(eq(schema.exercise.id, input.exerciseId))
              .limit(1)
          : [],
        input.lessonId
          ? client
              .select({ id: schema.lesson.id, title: schema.lesson.title })
              .from(schema.lesson)
              .where(eq(schema.lesson.id, input.lessonId))
              .limit(1)
          : []
      ]);

    const failedLookups = [
      ['profiles', profileResult],
      ['externalIds', externalIdResult],
      ['course', courseResult],
      ['tags', tagResult],
      ['statuses', statusResult],
      ['exercise', exerciseResult],
      ['lesson', lessonResult]
    ] as const;

    for (const [lookup, result] of failedLookups) {
      if (result.status === 'rejected') {
        console.error('getWebhookEventContext lookup error:', { lookup, error: result.reason });
      }
    }

    const profiles = profileResult.status === 'fulfilled' ? profileResult.value : [];
    const externalIds = externalIdResult.status === 'fulfilled' ? externalIdResult.value : [];
    const course = courseResult.status === 'fulfilled' ? courseResult.value : [];
    const tags = tagResult.status === 'fulfilled' ? tagResult.value : [];
    const statuses = statusResult.status === 'fulfilled' ? statusResult.value : [];
    const exercise = exerciseResult.status === 'fulfilled' ? exerciseResult.value : [];
    const lesson = lessonResult.status === 'fulfilled' ? lessonResult.value : [];

    const externalIdByProfile = new Map(externalIds.map((row) => [row.profileId, row.externalId]));
    const courseRow = course[0];

    return {
      profiles: new Map(
        profiles.map((row) => [
          row.id,
          { name: row.name, email: row.email, externalId: externalIdByProfile.get(row.id) ?? null }
        ])
      ),
      course: courseRow ? { ...courseRow, tags: tags.map((row) => row.name) } : null,
      statusLabels: new Map(statuses.map((row) => [row.id, row.label])),
      exercise: exercise[0] ?? null,
      lesson: lesson[0] ?? null
    };
  } catch (error) {
    console.error('getWebhookEventContext error:', error);
    throw new Error('Failed to read webhook event details');
  }
}

export async function listActiveEndpointsForEvent(
  organizationId: string,
  eventType: string,
  client: DbOrTxClient = db
): Promise<TWebhookEndpoint[]> {
  try {
    return await client
      .select()
      .from(schema.webhookEndpoint)
      .where(
        and(
          eq(schema.webhookEndpoint.organizationId, organizationId),
          eq(schema.webhookEndpoint.isActive, true),
          or(
            eq(schema.webhookEndpoint.eventMode, 'all'),
            sql`exists (
              select 1 from ${schema.webhookSubscription}
              where ${schema.webhookSubscription.webhookId} = ${schema.webhookEndpoint.id}
              and ${schema.webhookSubscription.eventType} = ${eventType}
            )`
          )
        )
      );
  } catch (error) {
    console.error('listActiveEndpointsForEvent error:', error);
    throw new Error('Failed to list webhook endpoints for event');
  }
}

/**
 * Stores the event and one PENDING delivery per target endpoint in a single transaction.
 * Returns the created delivery rows so the caller can schedule them after commit.
 */
export async function insertWebhookEventWithDeliveries(
  event: TNewWebhookEvent,
  deliveries: Omit<TNewWebhookDelivery, 'eventId'>[],
  client?: DbOrTxClient
): Promise<TWebhookDelivery[]> {
  const run = async (tx: DbOrTxClient) => {
    await tx.insert(schema.webhookEvent).values(event);

    if (deliveries.length === 0) return [];

    return tx
      .insert(schema.webhookDelivery)
      .values(deliveries.map((delivery) => ({ ...delivery, eventId: event.id })))
      .returning();
  };

  try {
    return client ? await run(client) : await db.transaction((tx) => run(tx));
  } catch (error) {
    console.error('insertWebhookEventWithDeliveries error:', error);
    throw new Error('Failed to record webhook event');
  }
}

export async function insertWebhookDelivery(
  values: TNewWebhookDelivery,
  client: DbOrTxClient = db
): Promise<TWebhookDelivery> {
  try {
    const [created] = await client.insert(schema.webhookDelivery).values(values).returning();

    if (!created) {
      throw new Error('Failed to create webhook delivery');
    }

    return created;
  } catch (error) {
    console.error('insertWebhookDelivery error:', error);
    throw new Error('Failed to create webhook delivery');
  }
}

export async function getWebhookDeliveryRecord(
  webhookId: string,
  deliveryId: string,
  client: DbOrTxClient = db
): Promise<TWebhookDeliveryRecord | null> {
  try {
    const [row] = await client
      .select({ delivery: schema.webhookDelivery, event: schema.webhookEvent })
      .from(schema.webhookDelivery)
      .innerJoin(schema.webhookEvent, eq(schema.webhookEvent.id, schema.webhookDelivery.eventId))
      .where(and(eq(schema.webhookDelivery.id, deliveryId), eq(schema.webhookDelivery.webhookId, webhookId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getWebhookDeliveryRecord error:', error);
    throw new Error('Failed to load webhook delivery');
  }
}

export async function listWebhookDeliveries(
  webhookId: string,
  options: { status?: TWebhookDelivery['status']; page: number; limit: number }
): Promise<{ items: TWebhookDeliveryRecord[]; total: number }> {
  try {
    const conditions = [eq(schema.webhookDelivery.webhookId, webhookId)];

    if (options.status) {
      conditions.push(eq(schema.webhookDelivery.status, options.status));
    }

    const where = and(...conditions);

    const [items, [totalRow]] = await Promise.all([
      db
        .select({ delivery: schema.webhookDelivery, event: schema.webhookEvent })
        .from(schema.webhookDelivery)
        .innerJoin(schema.webhookEvent, eq(schema.webhookEvent.id, schema.webhookDelivery.eventId))
        .where(where)
        .orderBy(desc(schema.webhookDelivery.createdAt))
        .limit(options.limit)
        .offset((options.page - 1) * options.limit),
      db.select({ total: count() }).from(schema.webhookDelivery).where(where)
    ]);

    return { items, total: totalRow?.total ?? 0 };
  } catch (error) {
    console.error('listWebhookDeliveries error:', error);
    throw new Error('Failed to list webhook deliveries');
  }
}

/**
 * Resets a delivery so the worker attempts it again. Keeps the event id so consumers can dedupe.
 */
export async function requeueWebhookDelivery(webhookId: string, deliveryId: string): Promise<TWebhookDelivery | null> {
  try {
    const [updated] = await db
      .update(schema.webhookDelivery)
      .set({
        status: 'PENDING',
        attempt: 0,
        nextAttemptAt: new Date().toISOString(),
        errorMessage: null,
        responseStatus: null,
        responseBody: null
      })
      .where(and(eq(schema.webhookDelivery.id, deliveryId), eq(schema.webhookDelivery.webhookId, webhookId)))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('requeueWebhookDelivery error:', error);
    throw new Error('Failed to requeue webhook delivery');
  }
}

/**
 * Returns the oldest due PENDING delivery for the endpoint without locking it; callers must hold the endpoint's Redis lock.
 */
export async function claimNextDueWebhookDelivery(
  webhookId: string,
  client: DbOrTxClient = db
): Promise<TWebhookDeliveryRecord | null> {
  try {
    const [row] = await client
      .select({ delivery: schema.webhookDelivery, event: schema.webhookEvent })
      .from(schema.webhookDelivery)
      .innerJoin(schema.webhookEvent, eq(schema.webhookEvent.id, schema.webhookDelivery.eventId))
      .where(
        and(
          eq(schema.webhookDelivery.webhookId, webhookId),
          eq(schema.webhookDelivery.status, 'PENDING'),
          lte(schema.webhookDelivery.nextAttemptAt, new Date().toISOString())
        )
      )
      .orderBy(schema.webhookDelivery.createdAt)
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('claimNextDueWebhookDelivery error:', error);
    throw new Error('Failed to claim webhook delivery');
  }
}

export async function recordWebhookAttempt(
  deliveryId: string,
  webhookId: string,
  affectsHealth: boolean,
  result: TWebhookAttemptResult,
  client?: DbOrTxClient
): Promise<TWebhookHealthTransition> {
  try {
    if (!client) {
      return await db.transaction((tx) => recordWebhookAttempt(deliveryId, webhookId, affectsHealth, result, tx));
    }

    const nowIso = new Date().toISOString();
    const status: TWebhookDelivery['status'] = result.success
      ? 'SUCCESS'
      : result.nextAttemptAt
        ? 'PENDING'
        : 'GAVE_UP';

    await client
      .update(schema.webhookDelivery)
      .set({
        status,
        attempt: result.attempt,
        nextAttemptAt: result.nextAttemptAt ? result.nextAttemptAt.toISOString() : null,
        requestHeaders: result.requestHeaders,
        responseStatus: result.responseStatus,
        responseBody: result.responseBody,
        errorMessage: result.errorMessage,
        durationMs: result.durationMs,
        deliveredAt: result.success ? nowIso : null
      })
      .where(eq(schema.webhookDelivery.id, deliveryId));

    if (!affectsHealth) return null;

    if (result.success) {
      await client
        .update(schema.webhookEndpoint)
        .set({ consecutiveFailures: 0, lastDeliveryStatus: 'SUCCESS', lastDeliveryAt: nowIso })
        .where(eq(schema.webhookEndpoint.id, webhookId));

      return null;
    }

    if (status !== 'GAVE_UP') return null;

    const [updated] = await client
      .update(schema.webhookEndpoint)
      .set({
        consecutiveFailures: sql`${schema.webhookEndpoint.consecutiveFailures} + 1`,
        lastDeliveryStatus: 'GAVE_UP',
        lastDeliveryAt: nowIso,
        isActive: sql`case when ${schema.webhookEndpoint.consecutiveFailures} + 1 >= ${result.failureThreshold} then false else ${schema.webhookEndpoint.isActive} end`,
        autoDisabledAt: sql`case when ${schema.webhookEndpoint.consecutiveFailures} + 1 >= ${result.failureThreshold} then ${nowIso}::timestamptz else ${schema.webhookEndpoint.autoDisabledAt} end`
      })
      .where(eq(schema.webhookEndpoint.id, webhookId))
      .returning({
        consecutiveFailures: schema.webhookEndpoint.consecutiveFailures,
        isActive: schema.webhookEndpoint.isActive
      });

    if (!updated) return null;
    if (updated.consecutiveFailures === result.failureThreshold && !updated.isActive) return 'disabled';
    if (updated.consecutiveFailures === WEBHOOK_DEGRADED_FAILURE_THRESHOLD) return 'degraded';

    return null;
  } catch (error) {
    console.error('recordWebhookAttempt error:', error);
    throw new Error('Failed to record webhook attempt');
  }
}

export async function deleteExpiredWebhookEvents(olderThan: Date): Promise<number> {
  try {
    const deleted = await db
      .delete(schema.webhookEvent)
      .where(lte(schema.webhookEvent.createdAt, olderThan.toISOString()))
      .returning({ id: schema.webhookEvent.id });

    return deleted.length;
  } catch (error) {
    console.error('deleteExpiredWebhookEvents error:', error);
    throw new Error('Failed to delete expired webhook events');
  }
}

export async function getEarliestPendingWebhookAttemptAt(
  webhookId: string,
  client: DbOrTxClient = db
): Promise<Date | null> {
  try {
    const [row] = await client
      .select({ nextAttemptAt: sql<string | null>`min(${schema.webhookDelivery.nextAttemptAt})` })
      .from(schema.webhookDelivery)
      .where(and(eq(schema.webhookDelivery.webhookId, webhookId), eq(schema.webhookDelivery.status, 'PENDING')));

    return row?.nextAttemptAt ? new Date(row.nextAttemptAt) : null;
  } catch (error) {
    console.error('getEarliestPendingWebhookAttemptAt error:', error);
    throw new Error('Failed to read pending webhook attempts');
  }
}

export async function listWebhookIdsWithDueDeliveries(limit = 200): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ webhookId: schema.webhookDelivery.webhookId })
      .from(schema.webhookDelivery)
      .where(
        and(
          eq(schema.webhookDelivery.status, 'PENDING'),
          lte(schema.webhookDelivery.nextAttemptAt, new Date(Date.now() - 60_000).toISOString())
        )
      )
      .limit(limit);

    return rows.map((row) => row.webhookId);
  } catch (error) {
    console.error('listWebhookIdsWithDueDeliveries error:', error);
    throw new Error('Failed to list webhook endpoints with due deliveries');
  }
}
