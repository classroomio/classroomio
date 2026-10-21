import * as schema from '@db/schema';
import type {
  TNewPluginEventDelivery,
  TNewPluginEventOutbox,
  TNewPluginEventSubscription,
  TPluginEventDelivery,
  TPluginEventOutbox,
  TPluginEventSubscription,
  TPluginInstallation
} from '@db/types';
import { and, desc, eq, inArray, isNull, lte, or } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function upsertEventSubscription(data: TNewPluginEventSubscription): Promise<TPluginEventSubscription> {
  const updatedAt = new Date().toISOString();
  const [row] = await db
    .insert(schema.pluginEventSubscription)
    .values(data)
    .onConflictDoUpdate({
      target: [schema.pluginEventSubscription.installationId, schema.pluginEventSubscription.eventType],
      set: {
        endpoint: data.endpoint,
        status: data.status ?? 'active',
        failureCount: 0,
        updatedAt
      }
    })
    .returning();

  return row;
}

export async function listSubscriptionsByInstallation(installationId: string): Promise<TPluginEventSubscription[]> {
  return db
    .select()
    .from(schema.pluginEventSubscription)
    .where(eq(schema.pluginEventSubscription.installationId, installationId));
}

export async function updateInstallationSubscriptionStatus(
  installationId: string,
  status: 'active' | 'disabled'
): Promise<void> {
  await db
    .update(schema.pluginEventSubscription)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(schema.pluginEventSubscription.installationId, installationId));
}

export async function listActiveSubscriptionsForEvent(
  eventType: string,
  organizationId?: string
): Promise<Array<{ subscription: TPluginEventSubscription; installation: TPluginInstallation }>> {
  const conditions = [
    eq(schema.pluginEventSubscription.eventType, eventType),
    eq(schema.pluginEventSubscription.status, 'active'),
    eq(schema.pluginInstallation.status, 'active')
  ];

  if (organizationId) {
    conditions.push(
      or(
        eq(schema.pluginInstallation.organizationId, organizationId),
        isNull(schema.pluginInstallation.organizationId)
      )!
    );
  }

  const rows = await db
    .select({
      subscription: schema.pluginEventSubscription,
      installation: schema.pluginInstallation
    })
    .from(schema.pluginEventSubscription)
    .innerJoin(
      schema.pluginInstallation,
      eq(schema.pluginEventSubscription.installationId, schema.pluginInstallation.id)
    )
    .where(and(...conditions));

  return rows;
}

export async function enqueueOutboxEvent(data: TNewPluginEventOutbox): Promise<TPluginEventOutbox> {
  const [row] = await db.insert(schema.pluginEventOutbox).values(data).returning();

  return row;
}

export async function createDeliveriesForOutboxEvent(
  outboxEventId: string,
  subscriptionIds: string[]
): Promise<TPluginEventDelivery[]> {
  if (subscriptionIds.length === 0) {
    return [];
  }

  const values: TNewPluginEventDelivery[] = subscriptionIds.map((subscriptionId) => ({
    outboxEventId,
    subscriptionId,
    status: 'pending',
    attemptCount: 0
  }));

  return db.insert(schema.pluginEventDelivery).values(values).returning();
}

export async function fetchPendingDeliveries(
  limit: number = 50
): Promise<
  Array<{ delivery: TPluginEventDelivery; outboxEvent: TPluginEventOutbox; subscription: TPluginEventSubscription }>
> {
  const nowIso = new Date().toISOString();

  const rows = await db
    .select({
      delivery: schema.pluginEventDelivery,
      outboxEvent: schema.pluginEventOutbox,
      subscription: schema.pluginEventSubscription
    })
    .from(schema.pluginEventDelivery)
    .innerJoin(schema.pluginEventOutbox, eq(schema.pluginEventDelivery.outboxEventId, schema.pluginEventOutbox.id))
    .innerJoin(
      schema.pluginEventSubscription,
      eq(schema.pluginEventDelivery.subscriptionId, schema.pluginEventSubscription.id)
    )
    .where(
      and(
        inArray(schema.pluginEventDelivery.status, ['pending', 'retry']),
        or(isNull(schema.pluginEventDelivery.nextRetryAt), lte(schema.pluginEventDelivery.nextRetryAt, nowIso))
      )
    )
    .limit(limit);

  return rows;
}

export async function recordDeliveryAttempt(
  deliveryId: string,
  params: {
    status: string;
    attemptCount: number;
    responseStatus?: number | null;
    errorMessage?: string | null;
    nextRetryAt?: string | null;
    deliveredAt?: string | null;
  }
): Promise<TPluginEventDelivery> {
  const [row] = await db
    .update(schema.pluginEventDelivery)
    .set({
      status: params.status,
      attemptCount: params.attemptCount,
      responseStatus: params.responseStatus ?? null,
      errorMessage: params.errorMessage ?? null,
      nextRetryAt: params.nextRetryAt ?? null,
      deliveredAt: params.deliveredAt ?? null
    })
    .where(eq(schema.pluginEventDelivery.id, deliveryId))
    .returning();

  return row;
}

export async function markOutboxEventProcessed(outboxEventId: string): Promise<void> {
  const processedAt = new Date().toISOString();

  await db
    .update(schema.pluginEventOutbox)
    .set({
      status: 'processed',
      processedAt
    })
    .where(eq(schema.pluginEventOutbox.id, outboxEventId));
}

export async function listDeliveriesByInstallation(
  installationId: string,
  limit: number = 50
): Promise<TPluginEventDelivery[]> {
  const rows = await db
    .select({ delivery: schema.pluginEventDelivery })
    .from(schema.pluginEventDelivery)
    .innerJoin(
      schema.pluginEventSubscription,
      eq(schema.pluginEventDelivery.subscriptionId, schema.pluginEventSubscription.id)
    )
    .where(eq(schema.pluginEventSubscription.installationId, installationId))
    .orderBy(desc(schema.pluginEventDelivery.createdAt))
    .limit(limit);

  return rows.map((r) => r.delivery);
}

export async function getEventDeliveryById(deliveryId: string): Promise<TPluginEventDelivery | null> {
  const [row] = await db
    .select()
    .from(schema.pluginEventDelivery)
    .where(eq(schema.pluginEventDelivery.id, deliveryId))
    .limit(1);

  return row ?? null;
}

export async function replayDeadLetterDelivery(deliveryId: string): Promise<TPluginEventDelivery | null> {
  const [row] = await db
    .update(schema.pluginEventDelivery)
    .set({
      status: 'pending',
      nextRetryAt: null,
      errorMessage: null
    })
    .where(eq(schema.pluginEventDelivery.id, deliveryId))
    .returning();

  return row ?? null;
}

export async function getEventDeliveryWithDetails(deliveryId: string): Promise<{
  delivery: TPluginEventDelivery;
  outboxEvent: TPluginEventOutbox;
  subscription: TPluginEventSubscription;
} | null> {
  const [row] = await db
    .select({
      delivery: schema.pluginEventDelivery,
      outboxEvent: schema.pluginEventOutbox,
      subscription: schema.pluginEventSubscription
    })
    .from(schema.pluginEventDelivery)
    .innerJoin(schema.pluginEventOutbox, eq(schema.pluginEventDelivery.outboxEventId, schema.pluginEventOutbox.id))
    .innerJoin(
      schema.pluginEventSubscription,
      eq(schema.pluginEventDelivery.subscriptionId, schema.pluginEventSubscription.id)
    )
    .where(eq(schema.pluginEventDelivery.id, deliveryId))
    .limit(1);

  return row ?? null;
}
