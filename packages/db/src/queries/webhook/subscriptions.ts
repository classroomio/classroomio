import * as schema from '@db/schema';

import { and, desc, eq, isNotNull, sql, type SQL } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewWebhookEndpoint } from '@db/types';
import { ROLE } from '@cio/utils/constants/roles';

import { attachEventTypes, createWebhookEndpoint, type TWebhookEndpointWithEvents } from './webhook';

export type TManagedWebhookSubscriptionValues = Pick<
  TNewWebhookEndpoint,
  'organizationId' | 'name' | 'payloadUrl' | 'secretCiphertext' | 'secretLast4' | 'createdByProfileId'
> & {
  oauthConsentId: string;
  filterCourseId: string | null;
  filterCohortId: string | null;
};

export type TManagedWebhookSubscriptionResult = {
  subscription: TWebhookEndpointWithEvents;
  created: boolean;
  /** True when an auto-disabled subscription was reactivated instead of created. */
  reactivated?: boolean;
};

export type TLatestWebhookEventsFilter = {
  courseId?: string;
  cohortId?: string;
  limit: number;
};

async function findManagedSubscriptionByTarget(
  oauthConsentId: string,
  payloadUrl: string,
  client: DbOrTxClient
): Promise<TWebhookEndpointWithEvents | null> {
  const [endpoint] = await client
    .select()
    .from(schema.webhookEndpoint)
    .where(
      and(eq(schema.webhookEndpoint.oauthConsentId, oauthConsentId), eq(schema.webhookEndpoint.payloadUrl, payloadUrl))
    )
    .limit(1);

  if (!endpoint) return null;

  const [withEvents] = await attachEventTypes([endpoint], client);

  return withEvents ?? null;
}

/**
 * Returns the connected app's subscription for `values.payloadUrl`, creating it for `eventType` when needed.
 * Serializes concurrent subscribes for one organization, so a retried request cannot create a duplicate row for
 * the same target. A repeat for the same event with different course or cohort filters updates the stored filters
 * instead of silently keeping the old ones.
 */
export async function upsertManagedWebhookSubscription(
  values: TManagedWebhookSubscriptionValues,
  eventType: string
): Promise<TManagedWebhookSubscriptionResult> {
  try {
    return await db.transaction(async (tx) => {
      await tx
        .select({ id: schema.organization.id })
        .from(schema.organization)
        .where(eq(schema.organization.id, values.organizationId))
        .for('update');

      const existing = await findManagedSubscriptionByTarget(values.oauthConsentId, values.payloadUrl, tx);

      if (existing) {
        if (existing.eventTypes[0] !== eventType) return { subscription: existing, created: false };

        const filtersMatch =
          existing.filterCourseId === values.filterCourseId && existing.filterCohortId === values.filterCohortId;
        const needsReactivation = !existing.isActive || existing.autoDisabledAt !== null;

        if (filtersMatch && !needsReactivation) return { subscription: existing, created: false };

        const [updated] = await tx
          .update(schema.webhookEndpoint)
          .set({
            filterCourseId: values.filterCourseId,
            filterCohortId: values.filterCohortId,
            isActive: true,
            consecutiveFailures: 0,
            autoDisabledAt: null
          })
          .where(eq(schema.webhookEndpoint.id, existing.id))
          .returning();

        if (!updated) return { subscription: existing, created: false };

        const [withEvents] = await attachEventTypes([updated], tx);

        return {
          subscription: withEvents ?? { ...existing, ...updated },
          created: false,
          reactivated: needsReactivation ? true : undefined
        };
      }

      const subscription = await createWebhookEndpoint(
        {
          ...values,
          updatedByProfileId: values.createdByProfileId,
          eventMode: 'selected',
          verifySsl: true,
          isActive: true
        },
        [eventType],
        tx
      );

      return { subscription, created: true };
    });
  } catch (error) {
    console.error('upsertManagedWebhookSubscription error:', error);
    throw new Error('Failed to create webhook subscription');
  }
}

/**
 * Deletes one subscription owned by the grant. Returns false when the grant has no such subscription.
 */
export async function deleteManagedWebhookSubscription(
  oauthConsentId: string,
  subscriptionId: string
): Promise<boolean> {
  try {
    const deleted = await db
      .delete(schema.webhookEndpoint)
      .where(
        and(eq(schema.webhookEndpoint.id, subscriptionId), eq(schema.webhookEndpoint.oauthConsentId, oauthConsentId))
      )
      .returning({ id: schema.webhookEndpoint.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('deleteManagedWebhookSubscription error:', error);
    throw new Error('Failed to delete webhook subscription');
  }
}

/**
 * Deletes a managed subscription by id regardless of grant, for the delivery worker. Customer endpoints are never matched.
 */
export async function deleteManagedWebhookSubscriptionById(subscriptionId: string): Promise<void> {
  try {
    await db
      .delete(schema.webhookEndpoint)
      .where(and(eq(schema.webhookEndpoint.id, subscriptionId), isNotNull(schema.webhookEndpoint.oauthConsentId)));
  } catch (error) {
    console.error('deleteManagedWebhookSubscriptionById error:', error);
    throw new Error('Failed to delete webhook subscription');
  }
}

export async function listManagedWebhookSubscriptions(organizationId: string): Promise<TWebhookEndpointWithEvents[]> {
  try {
    const endpoints = await db
      .select()
      .from(schema.webhookEndpoint)
      .where(
        and(eq(schema.webhookEndpoint.organizationId, organizationId), isNotNull(schema.webhookEndpoint.oauthConsentId))
      )
      .orderBy(desc(schema.webhookEndpoint.createdAt));

    return attachEventTypes(endpoints, db);
  } catch (error) {
    console.error('listManagedWebhookSubscriptions error:', error);
    throw new Error('Failed to list webhook subscriptions');
  }
}

/**
 * True while the grant behind a managed subscription still belongs to an active admin of the
 * organization it was issued for.
 */
export async function isManagedWebhookSubscriptionGrantActive(oauthConsentId: string): Promise<boolean> {
  try {
    const [grant] = await db
      .select({ id: schema.oauthConsent.id })
      .from(schema.oauthConsent)
      .innerJoin(
        schema.organizationmember,
        and(
          eq(schema.organizationmember.profileId, schema.oauthConsent.userId),
          eq(sql`${schema.organizationmember.organizationId}::text`, schema.oauthConsent.referenceId)
        )
      )
      .where(
        and(
          eq(schema.oauthConsent.id, oauthConsentId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN),
          eq(schema.organizationmember.status, 'ACTIVE')
        )
      )
      .limit(1);

    return Boolean(grant);
  } catch (error) {
    console.error('isManagedWebhookSubscriptionGrantActive error:', error);
    throw new Error('Failed to check webhook subscription grant');
  }
}

/**
 * The organization's most recent recorded envelopes of `eventType`, newest first.
 */
export async function listLatestWebhookEvents(
  organizationId: string,
  eventType: string,
  filter: TLatestWebhookEventsFilter
): Promise<Record<string, unknown>[]> {
  try {
    const conditions: SQL[] = [
      eq(schema.webhookEvent.organizationId, organizationId),
      eq(schema.webhookEvent.eventType, eventType)
    ];

    if (filter.courseId) {
      conditions.push(sql`${schema.webhookEvent.payload} -> 'data' ->> 'courseId' = ${filter.courseId}`);
    }

    if (filter.cohortId) {
      conditions.push(sql`${schema.webhookEvent.payload} -> 'data' ->> 'cohortId' = ${filter.cohortId}`);
    }

    const rows = await db
      .select({ payload: schema.webhookEvent.payload })
      .from(schema.webhookEvent)
      .where(and(...conditions))
      .orderBy(desc(schema.webhookEvent.createdAt))
      .limit(filter.limit);

    return rows.map((row) => row.payload);
  } catch (error) {
    console.error('listLatestWebhookEvents error:', error);
    throw new Error('Failed to list webhook events');
  }
}
