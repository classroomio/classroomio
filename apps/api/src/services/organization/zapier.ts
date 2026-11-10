import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { listOAuthConnectedApps } from '@cio/db/queries/auth';
import { getCourseTitlesByIds } from '@cio/db/queries/course/course';
import { getCohortTitlesByIds } from '@cio/db/queries/cohort/cohort';
import {
  getManagedWebhookEndpoint,
  listFailedWebhookDeliveriesSince,
  countFailedWebhookDeliveriesSince,
  listManagedWebhookSubscriptions,
  requeueWebhookDelivery,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import { enqueueWebhookDelivery } from '@cio/jobs';
import { getWebhookSubscriptionLimit } from '@cio/utils/plans';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { getZapierOAuthClientId } from '@api/services/oauth/clients';
import { resolveWebhookHealth } from '@api/services/webhook/webhook';

function toZapierTriggerView(
  subscription: TWebhookEndpointWithEvents,
  courseTitles: Map<string, string | null>,
  cohortTitles: Map<string, string | null>,
  failedDeliveryCounts: Map<string, number>
) {
  const courseTitle = subscription.filterCourseId ? (courseTitles.get(subscription.filterCourseId) ?? null) : null;
  const cohortTitle = subscription.filterCohortId ? (cohortTitles.get(subscription.filterCohortId) ?? null) : null;
  const health = resolveWebhookHealth(subscription);
  const failedDeliveryCount = failedDeliveryCounts.get(subscription.id) ?? 0;

  return {
    id: subscription.id,
    eventType: subscription.eventTypes[0],
    courseId: subscription.filterCourseId,
    courseTitle,
    cohortId: subscription.filterCohortId,
    cohortTitle,
    health,
    isActive: subscription.isActive,
    failedDeliveryCount,
    lastDeliveryStatus: subscription.lastDeliveryStatus,
    lastDeliveryAt: subscription.lastDeliveryAt,
    createdAt: subscription.createdAt
  };
}

async function listZapierConnectedApps(organizationId: string) {
  const zapierClientId = getZapierOAuthClientId();
  if (!zapierClientId) return [];

  return listOAuthConnectedApps(organizationId, { clientId: zapierClientId });
}

/**
 * The organization's Zapier connections, each with its active trigger subscriptions, plus the plan's trigger cap.
 */
export async function getZapierConnectionsService(organizationId: string) {
  const [zapierApps, subscriptions, activePlan] = await Promise.all([
    listZapierConnectedApps(organizationId),
    listManagedWebhookSubscriptions(organizationId),
    getActiveOrganizationPlan(organizationId)
  ]);

  const zapierConsentIds = new Set(zapierApps.map((app) => app.consentId));
  const zapierSubscriptions = subscriptions.filter(
    (subscription) => subscription.oauthConsentId && zapierConsentIds.has(subscription.oauthConsentId)
  );
  const courseIds = zapierSubscriptions.flatMap((subscription) =>
    subscription.filterCourseId ? [subscription.filterCourseId] : []
  );
  const cohortIds = zapierSubscriptions.flatMap((subscription) =>
    subscription.filterCohortId ? [subscription.filterCohortId] : []
  );
  const [courseTitles, cohortTitles, failedDeliveryCounts] = await Promise.all([
    getCourseTitlesByIds([...new Set(courseIds)]),
    getCohortTitlesByIds([...new Set(cohortIds)]),
    countFailedWebhookDeliveriesSince(
      zapierSubscriptions.map((subscription) => subscription.id),
      new Date(Date.now() - ZAPIER_FAILED_EVENT_WINDOW_MS)
    )
  ]);

  const connections = zapierApps.map((app) => {
    const triggers = zapierSubscriptions
      .filter((subscription) => subscription.oauthConsentId === app.consentId)
      .map((subscription) => toZapierTriggerView(subscription, courseTitles, cohortTitles, failedDeliveryCounts));
    const connectedAt = app.createdAt.toISOString();
    const lastUsedAt = app.lastUsedAt ? new Date(app.lastUsedAt).toISOString() : null;

    return {
      consentId: app.consentId,
      authorizedBy: { profileId: app.userId, fullname: app.userFullname },
      scopes: app.scopes,
      connectedAt,
      lastUsedAt,
      triggers
    };
  });

  const maxTriggerSubscriptions = getWebhookSubscriptionLimit(activePlan?.planName);
  const limits = { maxTriggerSubscriptions, activeTriggerSubscriptions: subscriptions.length };

  return { connections, limits };
}

const ZAPIER_FAILED_EVENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Retries the last 24 hours of failed deliveries for one Zapier-managed trigger subscription.
 * The delivery keeps its event id, so Zaps can dedupe a repeat.
 */
export async function redeliverZapierTriggerFailuresService(organizationId: string, webhookId: string) {
  const [endpoint, zapierApps] = await Promise.all([
    getManagedWebhookEndpoint(organizationId, webhookId),
    listZapierConnectedApps(organizationId)
  ]);

  const consentId = endpoint?.oauthConsentId ?? null;
  const isZapierEndpoint = Boolean(consentId) && zapierApps.some((app) => app.consentId === consentId);

  if (!endpoint || !isZapierEndpoint) {
    throw new AppError('Zapier trigger not found', ErrorCodes.WEBHOOK_NOT_FOUND, 404);
  }

  if (!endpoint.isActive) {
    throw new AppError('This trigger is disabled', ErrorCodes.WEBHOOK_ENDPOINT_DISABLED, 409);
  }

  const since = new Date(Date.now() - ZAPIER_FAILED_EVENT_WINDOW_MS);
  const failedDeliveries = await listFailedWebhookDeliveriesSince(webhookId, since);

  for (const delivery of failedDeliveries) {
    await requeueWebhookDelivery(webhookId, delivery.id);
  }

  if (failedDeliveries.length > 0) {
    await enqueueWebhookDelivery({ webhookId });
  }

  return { redelivered: failedDeliveries.length };
}

/**
 * Retries the last 24 hours of failed deliveries for every given Zapier-managed
 * trigger subscription in one call, so a single dashboard click covers an outage
 * affecting more triggers than the per-minute redelivery budget allows.
 * Triggers that no longer exist or are disabled are reported, not retried.
 */
export async function redeliverZapierTriggerFailuresBulkService(organizationId: string, triggerIds: string[]) {
  const uniqueIds = [...new Set(triggerIds)];
  let redelivered = 0;
  const failed: Array<{ triggerId: string; error: string }> = [];

  for (const triggerId of uniqueIds) {
    try {
      const result = await redeliverZapierTriggerFailuresService(organizationId, triggerId);
      redelivered += result.redelivered;
    } catch (error) {
      failed.push({
        triggerId,
        error: error instanceof AppError ? error.message : 'Failed to redeliver trigger events'
      });
    }
  }

  return { redelivered, failed };
}
