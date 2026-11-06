import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { listOAuthConnectedApps } from '@cio/db/queries/auth';
import { getCourseTitlesByIds } from '@cio/db/queries/course/course';
import { getCohortTitlesByIds } from '@cio/db/queries/cohort/cohort';
import {
  getManagedWebhookEndpoint,
  listFailedWebhookDeliveriesSince,
  listManagedWebhookSubscriptions,
  requeueWebhookDelivery,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import { enqueueWebhookDelivery } from '@cio/jobs';
import { getWebhookSubscriptionLimit } from '@cio/utils/plans';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { getConnectedAppKind } from '@api/services/oauth/clients';
import { resolveWebhookHealth } from '@api/services/webhook/webhook';

function toZapierTriggerView(
  subscription: TWebhookEndpointWithEvents,
  courseTitles: Map<string, string | null>,
  cohortTitles: Map<string, string | null>
) {
  return {
    id: subscription.id,
    eventType: subscription.eventTypes[0],
    courseId: subscription.filterCourseId,
    courseTitle: subscription.filterCourseId ? (courseTitles.get(subscription.filterCourseId) ?? null) : null,
    cohortId: subscription.filterCohortId,
    cohortTitle: subscription.filterCohortId ? (cohortTitles.get(subscription.filterCohortId) ?? null) : null,
    health: resolveWebhookHealth(subscription),
    isActive: subscription.isActive,
    lastDeliveryStatus: subscription.lastDeliveryStatus,
    lastDeliveryAt: subscription.lastDeliveryAt,
    createdAt: subscription.createdAt
  };
}

/**
 * The organization's Zapier connections, each with its active trigger subscriptions, plus the plan's trigger cap.
 */
export async function getZapierConnectionsService(organizationId: string) {
  const [apps, subscriptions, activePlan] = await Promise.all([
    listOAuthConnectedApps(organizationId),
    listManagedWebhookSubscriptions(organizationId),
    getActiveOrganizationPlan(organizationId)
  ]);

  const zapierApps = apps.filter((app) => getConnectedAppKind(app.clientId) === 'zapier');
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
  const [courseTitles, cohortTitles] = await Promise.all([
    getCourseTitlesByIds([...new Set(courseIds)]),
    getCohortTitlesByIds([...new Set(cohortIds)])
  ]);

  const connections = zapierApps.map((app) => {
    const triggers = zapierSubscriptions
      .filter((subscription) => subscription.oauthConsentId === app.consentId)
      .map((subscription) => toZapierTriggerView(subscription, courseTitles, cohortTitles));

    return {
      consentId: app.consentId,
      authorizedBy: { profileId: app.userId, fullname: app.userFullname },
      scopes: app.scopes,
      connectedAt: app.createdAt.toISOString(),
      lastUsedAt: app.lastUsedAt ? new Date(app.lastUsedAt).toISOString() : null,
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
  const [endpoint, apps] = await Promise.all([
    getManagedWebhookEndpoint(organizationId, webhookId),
    listOAuthConnectedApps(organizationId)
  ]);

  const consentId = endpoint?.oauthConsentId ?? null;
  const isZapierEndpoint =
    Boolean(consentId) &&
    apps.some((app) => app.consentId === consentId && getConnectedAppKind(app.clientId) === 'zapier');

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
