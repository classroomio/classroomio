import { env } from '@cio/core/config/env';
import { attemptWebhookDelivery, createWebhookRecordId } from '@cio/core/services/webhook/deliver';
import { buildWebhookEnvelope } from '@cio/core/services/webhook/emit';
import { getWebhookUrlPolicy } from '@cio/core/services/webhook/policy';
import { encryptWebhookSecret, generateWebhookSecret } from '@cio/core/services/webhook/secret';
import { invalidateOrgWebhookEndpoints } from '@cio/core/services/webhook/endpoint-cache';
import { hasWebhookEntitlement } from '@cio/core/services/webhook/entitlement';
import { assertWebhookUrlShape, resolveWebhookTarget, WebhookUrlError } from '@cio/core/services/webhook/url-guard';
import { db } from '@cio/db/drizzle';
import {
  createWebhookEndpointWithinLimit,
  deleteWebhookEndpoint,
  getWebhookDeliveryRecord,
  getWebhookDeliveryStats,
  getWebhookEndpoint,
  insertWebhookEventWithDeliveries,
  listWebhookDeliveries,
  listWebhookEndpoints,
  recordWebhookAttempt,
  requeueWebhookDelivery,
  updateWebhookEndpoint,
  type TWebhookDeliveryRecord,
  type TWebhookDeliveryStats,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import { enqueueWebhookDelivery } from '@cio/jobs';
import {
  WEBHOOK_DEGRADED_FAILURE_THRESHOLD,
  WEBHOOK_EVENT_TYPES,
  WEBHOOK_MAX_ENDPOINTS_PER_ORG,
  type TWebhookEndpointHealth
} from '@cio/utils/constants/webhook';
import type { TCreateWebhook, TUpdateWebhook, TWebhookDeliveryListQuery } from '@cio/utils/validation/webhook';

import { AppError, ErrorCodes } from '@api/utils/errors';

function resolveHealth(endpoint: TWebhookEndpointWithEvents): TWebhookEndpointHealth {
  if (!endpoint.isActive && endpoint.autoDisabledAt) return 'disabled';
  if (endpoint.consecutiveFailures >= WEBHOOK_DEGRADED_FAILURE_THRESHOLD) return 'degraded';

  return 'healthy';
}

const RECENT_DELIVERIES_WINDOW_MS = 24 * 60 * 60 * 1000;
const NO_RECENT_DELIVERIES: TWebhookDeliveryStats = { total: 0, failed: 0 };

export function toWebhookView(
  endpoint: TWebhookEndpointWithEvents,
  recentDeliveries: TWebhookDeliveryStats = NO_RECENT_DELIVERIES
) {
  return {
    id: endpoint.id,
    name: endpoint.name,
    payloadUrl: endpoint.payloadUrl,
    verifySsl: endpoint.verifySsl,
    eventMode: endpoint.eventMode as 'all' | 'selected',
    eventTypes: endpoint.eventTypes,
    isActive: endpoint.isActive,
    health: resolveHealth(endpoint),
    consecutiveFailures: endpoint.consecutiveFailures,
    hasSecret: Boolean(endpoint.secretCiphertext),
    secretLast4: endpoint.secretLast4,
    lastDeliveryStatus: endpoint.lastDeliveryStatus,
    lastDeliveryAt: endpoint.lastDeliveryAt,
    autoDisabledAt: endpoint.autoDisabledAt,
    recentDeliveries,
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt
  };
}

function toDeliverySummary(record: TWebhookDeliveryRecord) {
  const { delivery, event } = record;

  return {
    id: delivery.id,
    eventId: event.id,
    eventType: event.eventType,
    status: delivery.status,
    attempt: delivery.attempt,
    isTest: delivery.isTest,
    responseStatus: delivery.responseStatus,
    durationMs: delivery.durationMs,
    errorMessage: delivery.errorMessage,
    nextAttemptAt: delivery.nextAttemptAt,
    deliveredAt: delivery.deliveredAt,
    createdAt: delivery.createdAt
  };
}

function toDeliveryDetail(record: TWebhookDeliveryRecord) {
  return {
    ...toDeliverySummary(record),
    requestHeaders: record.delivery.requestHeaders ?? {},
    responseBody: record.delivery.responseBody,
    payload: record.event.payload
  };
}

/**
 * Throws 403 unless the org's plan includes REST API access, which webhooks share.
 */
export async function assertWebhooksAllowed(organizationId: string): Promise<void> {
  if (await hasWebhookEntitlement(organizationId)) return;

  throw new AppError(
    env.PUBLIC_IS_SELFHOSTED === 'true'
      ? 'Webhooks require an Enterprise plan'
      : 'Webhooks require an Early Adopter or Enterprise plan',
    ErrorCodes.UPGRADE_REQUIRED,
    403
  );
}

async function assertPayloadUrlAllowed(payloadUrl: string): Promise<void> {
  const policy = getWebhookUrlPolicy();

  try {
    const parsed = assertWebhookUrlShape(payloadUrl, policy);
    await resolveWebhookTarget(parsed, policy);
  } catch (error) {
    if (error instanceof WebhookUrlError) {
      throw new AppError(error.message, ErrorCodes.WEBHOOK_URL_INVALID, 400, 'payloadUrl');
    }

    throw error;
  }
}

async function loadRecentDeliveryStats(webhookIds: string[]) {
  const sinceIso = new Date(Date.now() - RECENT_DELIVERIES_WINDOW_MS).toISOString();

  return getWebhookDeliveryStats(webhookIds, sinceIso);
}

async function toWebhookViewWithStats(endpoint: TWebhookEndpointWithEvents) {
  const stats = await loadRecentDeliveryStats([endpoint.id]);

  return toWebhookView(endpoint, stats.get(endpoint.id));
}

async function loadWebhookOrThrow(organizationId: string, webhookId: string) {
  const endpoint = await getWebhookEndpoint(organizationId, webhookId);

  if (!endpoint) {
    throw new AppError('Webhook not found', ErrorCodes.WEBHOOK_NOT_FOUND, 404);
  }

  return endpoint;
}

export async function listWebhooksService(organizationId: string) {
  await assertWebhooksAllowed(organizationId);
  const endpoints = await listWebhookEndpoints(organizationId);

  const stats = await loadRecentDeliveryStats(endpoints.map((endpoint) => endpoint.id));

  return endpoints.map((endpoint) => toWebhookView(endpoint, stats.get(endpoint.id)));
}

export async function getWebhookService(organizationId: string, webhookId: string) {
  await assertWebhooksAllowed(organizationId);

  return toWebhookViewWithStats(await loadWebhookOrThrow(organizationId, webhookId));
}

/**
 * Creates the endpoint and returns the plaintext signing secret, which is never readable again.
 * A secret is generated when the caller does not supply one.
 */
export async function createWebhookService(organizationId: string, profileId: string, payload: TCreateWebhook) {
  await assertWebhooksAllowed(organizationId);

  await assertPayloadUrlAllowed(payload.payloadUrl);

  const secret = payload.secret ?? generateWebhookSecret();
  const eventTypes = payload.eventMode === 'all' ? [...WEBHOOK_EVENT_TYPES] : payload.eventTypes;
  const secretCiphertext = encryptWebhookSecret(secret);

  const created = await createWebhookEndpointWithinLimit(
    {
      organizationId,
      name: payload.name,
      payloadUrl: payload.payloadUrl,
      secretCiphertext,
      secretLast4: secret.slice(-4),
      verifySsl: payload.verifySsl,
      eventMode: payload.eventMode,
      isActive: payload.isActive,
      createdByProfileId: profileId,
      updatedByProfileId: profileId
    },
    eventTypes,
    WEBHOOK_MAX_ENDPOINTS_PER_ORG
  );

  if (!created) {
    throw new AppError(
      `You can create up to ${WEBHOOK_MAX_ENDPOINTS_PER_ORG} webhooks`,
      ErrorCodes.WEBHOOK_LIMIT_EXCEEDED,
      403
    );
  }

  await invalidateOrgWebhookEndpoints(organizationId);

  return { webhook: toWebhookView(created), secret };
}

export async function updateWebhookService(
  organizationId: string,
  webhookId: string,
  profileId: string,
  payload: TUpdateWebhook
) {
  await assertWebhooksAllowed(organizationId);
  const current = await loadWebhookOrThrow(organizationId, webhookId);

  if (payload.payloadUrl !== undefined && payload.payloadUrl !== current.payloadUrl) {
    await assertPayloadUrlAllowed(payload.payloadUrl);
  }

  const eventMode = payload.eventMode ?? (current.eventMode as 'all' | 'selected');
  const nextEventTypes = eventMode === 'all' ? [...WEBHOOK_EVENT_TYPES] : (payload.eventTypes ?? current.eventTypes);

  if (eventMode === 'selected' && nextEventTypes.length === 0) {
    throw new AppError('Select at least one event', ErrorCodes.VALIDATION_ERROR, 400, 'eventTypes');
  }

  const reEnabling = payload.isActive === true && !current.isActive;
  const secretFields = payload.secret
    ? { secretCiphertext: encryptWebhookSecret(payload.secret), secretLast4: payload.secret.slice(-4) }
    : {};
  const healthResetFields = reEnabling ? { consecutiveFailures: 0, autoDisabledAt: null } : {};
  const eventTypesToStore =
    payload.eventMode !== undefined || payload.eventTypes !== undefined ? nextEventTypes : undefined;

  const updated = await updateWebhookEndpoint(
    organizationId,
    webhookId,
    {
      name: payload.name,
      payloadUrl: payload.payloadUrl,
      verifySsl: payload.verifySsl,
      eventMode,
      isActive: payload.isActive,
      ...secretFields,
      ...healthResetFields,
      updatedByProfileId: profileId
    },
    eventTypesToStore
  );

  if (!updated) {
    throw new AppError('Webhook not found', ErrorCodes.WEBHOOK_NOT_FOUND, 404);
  }

  await invalidateOrgWebhookEndpoints(organizationId);

  if (reEnabling) {
    await enqueueWebhookDelivery({ webhookId });
  }

  return toWebhookViewWithStats(updated);
}

export async function regenerateWebhookSecretService(organizationId: string, webhookId: string, profileId: string) {
  await assertWebhooksAllowed(organizationId);
  await loadWebhookOrThrow(organizationId, webhookId);

  const secret = generateWebhookSecret();
  const secretCiphertext = encryptWebhookSecret(secret);
  const updated = await updateWebhookEndpoint(organizationId, webhookId, {
    secretCiphertext,
    secretLast4: secret.slice(-4),
    updatedByProfileId: profileId
  });

  if (!updated) {
    throw new AppError('Webhook not found', ErrorCodes.WEBHOOK_NOT_FOUND, 404);
  }

  return { webhook: await toWebhookViewWithStats(updated), secret };
}

export async function deleteWebhookService(organizationId: string, webhookId: string) {
  await assertWebhooksAllowed(organizationId);

  const deleted = await deleteWebhookEndpoint(organizationId, webhookId);

  if (!deleted) {
    throw new AppError('Webhook not found', ErrorCodes.WEBHOOK_NOT_FOUND, 404);
  }

  await invalidateOrgWebhookEndpoints(organizationId);
}

/**
 * Sends one signed sample event synchronously and logs it. A failed test is terminal and
 * does not count toward the endpoint's health.
 */
export async function sendTestWebhookService(organizationId: string, webhookId: string) {
  await assertWebhooksAllowed(organizationId);
  const endpoint = await loadWebhookOrThrow(organizationId, webhookId);

  const envelope = await buildWebhookEnvelope(organizationId, 'webhook.test', {
    message: 'This is a test event from ClassroomIO.',
    webhookId
  });
  const deliveryId = createWebhookRecordId('whd');

  await insertWebhookEventWithDeliveries(
    { id: envelope.id, organizationId, eventType: 'webhook.test', payload: envelope },
    [{ id: deliveryId, webhookId, isTest: true, nextAttemptAt: null }]
  );

  const pending = await getWebhookDeliveryRecord(webhookId, deliveryId);

  if (!pending) {
    throw new AppError('Failed to record test event', ErrorCodes.INTERNAL_ERROR, 500);
  }

  const result = await attemptWebhookDelivery(endpoint, pending.delivery, pending.event, { allowRetry: false });
  await recordWebhookAttempt(deliveryId, webhookId, false, result, db);

  const record = await getWebhookDeliveryRecord(webhookId, deliveryId);

  if (!record) {
    throw new AppError('Failed to load test delivery', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return toDeliveryDetail(record);
}

export async function listWebhookDeliveriesService(
  organizationId: string,
  webhookId: string,
  query: TWebhookDeliveryListQuery
) {
  await assertWebhooksAllowed(organizationId);
  await loadWebhookOrThrow(organizationId, webhookId);

  const { items, total } = await listWebhookDeliveries(webhookId, query);

  return {
    items: items.map(toDeliverySummary),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) }
  };
}

export async function getWebhookDeliveryService(organizationId: string, webhookId: string, deliveryId: string) {
  await assertWebhooksAllowed(organizationId);
  await loadWebhookOrThrow(organizationId, webhookId);

  const record = await getWebhookDeliveryRecord(webhookId, deliveryId);

  if (!record) {
    throw new AppError('Delivery not found', ErrorCodes.WEBHOOK_DELIVERY_NOT_FOUND, 404);
  }

  return toDeliveryDetail(record);
}

/**
 * Queues another attempt for a retained delivery. The event id is unchanged so consumers can dedupe.
 */
export async function redeliverWebhookService(organizationId: string, webhookId: string, deliveryId: string) {
  await assertWebhooksAllowed(organizationId);
  const endpoint = await loadWebhookOrThrow(organizationId, webhookId);

  if (!endpoint.isActive) {
    throw new AppError('Enable the webhook before redelivering events', ErrorCodes.WEBHOOK_ENDPOINT_DISABLED, 409);
  }

  const requeued = await requeueWebhookDelivery(webhookId, deliveryId);

  if (!requeued) {
    throw new AppError('Delivery not found', ErrorCodes.WEBHOOK_DELIVERY_NOT_FOUND, 404);
  }

  await enqueueWebhookDelivery({ webhookId });
  const record = await getWebhookDeliveryRecord(webhookId, deliveryId);

  if (!record) {
    throw new AppError('Delivery not found', ErrorCodes.WEBHOOK_DELIVERY_NOT_FOUND, 404);
  }

  return toDeliverySummary(record);
}
