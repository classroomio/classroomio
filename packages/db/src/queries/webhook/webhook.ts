import * as schema from '@db/schema';

import type {
  TNewWebhookDelivery,
  TNewWebhookEndpoint,
  TNewWebhookEvent,
  TWebhookDelivery,
  TWebhookEndpoint,
  TWebhookEvent
} from '@db/types';
import { and, count, desc, eq, inArray, lte, or, sql } from 'drizzle-orm';
import { db, type DbOrTxClient, type TxClient } from '@db/drizzle';

export type TWebhookEndpointWithEvents = TWebhookEndpoint & { eventTypes: string[] };

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
 * Runs `work` inside a transaction holding a per-endpoint advisory lock, so only one worker
 * delivers to an endpoint at a time. Returns `null` without running `work` when another worker holds it.
 */
/**
 * Returns the oldest PENDING delivery for the endpoint that is due, locking the row.
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
): Promise<void> {
  try {
    if (!client) {
      await db.transaction((tx) => recordWebhookAttempt(deliveryId, webhookId, affectsHealth, result, tx));

      return;
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

    if (!affectsHealth) return;

    if (result.success) {
      await client
        .update(schema.webhookEndpoint)
        .set({ consecutiveFailures: 0, lastDeliveryStatus: 'SUCCESS', lastDeliveryAt: nowIso })
        .where(eq(schema.webhookEndpoint.id, webhookId));

      return;
    }

    if (status !== 'GAVE_UP') return;

    await client
      .update(schema.webhookEndpoint)
      .set({
        consecutiveFailures: sql`${schema.webhookEndpoint.consecutiveFailures} + 1`,
        lastDeliveryStatus: 'GAVE_UP',
        lastDeliveryAt: nowIso,
        isActive: sql`case when ${schema.webhookEndpoint.consecutiveFailures} + 1 >= ${result.failureThreshold} then false else ${schema.webhookEndpoint.isActive} end`,
        autoDisabledAt: sql`case when ${schema.webhookEndpoint.consecutiveFailures} + 1 >= ${result.failureThreshold} then ${nowIso}::timestamptz else ${schema.webhookEndpoint.autoDisabledAt} end`
      })
      .where(eq(schema.webhookEndpoint.id, webhookId));
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
