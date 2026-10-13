import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '@api/utils/errors';
import {
  createDeliveriesForOutboxEvent,
  enqueueOutboxEvent,
  fetchPendingDeliveries,
  getEventDeliveryById,
  getEventDeliveryWithDetails,
  getInstallationById,
  getPluginVersionById,
  listActiveSubscriptionsForEvent,
  listDeliveriesByInstallation,
  listSubscriptionsByInstallation,
  recordDeliveryAttempt,
  replayDeadLetterDelivery,
  upsertEventSubscription
} from '@cio/db/queries/plugin';
import type { TPluginEventDelivery, TPluginEventOutbox, TPluginEventSubscription } from '@cio/db/types';
import { requireOrganizationInstallation } from './authorization';

function getWebhookMasterSecret(pluginId: string): string {
  const environmentKey = `PLUGIN_WEBHOOK_SECRET_${pluginId.replace(/[^a-z0-9]/gi, '_').toUpperCase()}`;
  const masterKey = process.env[environmentKey];

  if (masterKey) return masterKey;
  if (process.env.NODE_ENV === 'test') return 'test-only-plugin-webhook-secret';

  throw new AppError(`Webhook signing secret is not configured for ${pluginId}`, 'PLUGIN_CONFIGURATION_ERROR', 503);
}

export function getInstallationWebhookSecret(installationId: string, pluginId: string): string {
  const masterKey = getWebhookMasterSecret(pluginId);

  return createHmac('sha256', masterKey).update(installationId).digest('hex');
}

export function createWebhookSignature(secret: string, timestamp: number, payloadString: string): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payloadString}`).digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  secret: string,
  signatureHeader: string,
  payloadString: string,
  toleranceSeconds: number = 300
): boolean {
  const parts = signatureHeader.split(',');
  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key === 't') timestamp = Number(val);
    if (key === 'v1') signature = val;
  }

  if (!timestamp || !signature || Number.isNaN(timestamp)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret).update(`${timestamp}.${payloadString}`).digest('hex');
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

export async function registerEventSubscription(
  installationId: string,
  eventType: string,
  endpoint: string
): Promise<TPluginEventSubscription> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active') {
    throw new AppError('Installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const version = await getPluginVersionById(installation.pluginVersionId);
  const manifest = version?.manifest as {
    events?: { subscriptions?: string[] };
    runtime?: { backend?: { baseUrl?: string; webhookPath?: string } };
  } | null;
  const declaredEvents = manifest?.events?.subscriptions ?? [];
  if (!declaredEvents.includes(eventType)) {
    throw new AppError('Event is not declared by the installed plugin version', 'FORBIDDEN', 403);
  }

  const backend = manifest?.runtime?.backend;
  if (!backend?.baseUrl) {
    throw new AppError('Plugin has no declared remote backend', 'FORBIDDEN', 403);
  }

  const expectedEndpoint = new URL(backend.webhookPath ?? '/v1/webhooks/classroomio', backend.baseUrl).toString();
  if (new URL(endpoint).toString() !== expectedEndpoint) {
    throw new AppError('Webhook endpoint does not match the installed manifest', 'FORBIDDEN', 403);
  }

  return upsertEventSubscription({
    installationId,
    eventType,
    endpoint,
    status: 'active'
  });
}

export async function getInstallationSubscriptions(
  installationId: string,
  organizationId: string
): Promise<TPluginEventSubscription[]> {
  await requireOrganizationInstallation(installationId, organizationId);

  return listSubscriptionsByInstallation(installationId);
}

export async function getInstallationDeliveries(
  installationId: string,
  organizationId: string,
  limit: number = 50
): Promise<TPluginEventDelivery[]> {
  await requireOrganizationInstallation(installationId, organizationId);

  return listDeliveriesByInstallation(installationId, limit);
}

export async function deliverEvent(deliveryId: string): Promise<TPluginEventDelivery> {
  const details = await getEventDeliveryWithDetails(deliveryId);
  if (!details) {
    throw new AppError('Event delivery record not found', 'DELIVERY_NOT_FOUND', 404);
  }

  const { delivery, outboxEvent, subscription } = details;
  if (subscription.status !== 'active') {
    return delivery;
  }

  const installation = await getInstallationById(subscription.installationId);
  if (!installation || installation.status !== 'active') {
    return delivery;
  }

  const secret = getInstallationWebhookSecret(subscription.installationId, installation.pluginId);
  const now = Math.floor(Date.now() / 1000);
  const envelope = {
    id: delivery.id,
    eventId: outboxEvent.id,
    type: outboxEvent.eventType,
    occurredAt: outboxEvent.createdAt,
    organizationId: outboxEvent.organizationId,
    installationId: subscription.installationId,
    attempt: delivery.attemptCount + 1,
    data: outboxEvent.payload
  };

  const payloadString = JSON.stringify(envelope);
  const signatureHeader = createWebhookSignature(secret, now, payloadString);

  let responseStatus: number | null = null;
  let errorMessage: string | null = null;
  let isSuccess = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClassroomIO-Webhook-Worker/2.0',
        'X-ClassroomIO-Signature': signatureHeader,
        'X-ClassroomIO-Event': outboxEvent.eventType,
        'X-ClassroomIO-Delivery': delivery.id
      },
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    responseStatus = response.status;
    isSuccess = response.ok;
    if (!isSuccess) {
      errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    }
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : 'Unknown network failure';
  }

  const nextAttemptCount = delivery.attemptCount + 1;

  if (isSuccess) {
    const deliveredAt = new Date().toISOString();

    return recordDeliveryAttempt(deliveryId, {
      status: 'delivered',
      attemptCount: nextAttemptCount,
      responseStatus,
      deliveredAt
    });
  }

  const MAX_ATTEMPTS = 5;
  const isDeadLetter = nextAttemptCount >= MAX_ATTEMPTS;
  const status = isDeadLetter ? 'dead_letter' : 'retry';

  let nextRetryAt: string | null = null;
  if (!isDeadLetter) {
    const backoffSeconds = Math.min(Math.pow(3, nextAttemptCount) * 10, 3600);
    const retryDate = new Date(Date.now() + backoffSeconds * 1000);
    nextRetryAt = retryDate.toISOString();
  }

  return recordDeliveryAttempt(deliveryId, {
    status,
    attemptCount: nextAttemptCount,
    responseStatus,
    errorMessage,
    nextRetryAt
  });
}

export async function publishOutboxEvent(
  eventType: string,
  payload: Record<string, unknown>,
  organizationId?: string
): Promise<{ outboxEvent: TPluginEventOutbox; deliveryCount: number }> {
  const outboxEvent = await enqueueOutboxEvent({
    eventType,
    payload,
    organizationId: organizationId ?? null
  });

  const matchingSubs = await listActiveSubscriptionsForEvent(eventType, organizationId);
  const subscriptionIds = matchingSubs.map((sub) => sub.subscription.id);
  const deliveries = await createDeliveriesForOutboxEvent(outboxEvent.id, subscriptionIds);

  const deliveryCount = deliveries.length;

  return { outboxEvent, deliveryCount };
}

export async function processPendingOutboxDeliveries(limit: number = 20): Promise<number> {
  const pending = await fetchPendingDeliveries(limit);
  if (pending.length === 0) {
    return 0;
  }

  for (const item of pending) {
    await deliverEvent(item.delivery.id);
  }

  return pending.length;
}

export async function replayDelivery(deliveryId: string, organizationId: string): Promise<TPluginEventDelivery> {
  const details = await getEventDeliveryWithDetails(deliveryId);
  if (!details) {
    throw new AppError('Delivery not found', 'DELIVERY_NOT_FOUND', 404);
  }

  await requireOrganizationInstallation(details.subscription.installationId, organizationId);

  const replayed = await replayDeadLetterDelivery(deliveryId);
  if (!replayed) {
    throw new AppError('Delivery not found', 'DELIVERY_NOT_FOUND', 404);
  }

  return deliverEvent(replayed.id);
}

export async function getDeliveryDetails(deliveryId: string): Promise<TPluginEventDelivery> {
  const delivery = await getEventDeliveryById(deliveryId);
  if (!delivery) {
    throw new AppError('Delivery not found', 'DELIVERY_NOT_FOUND', 404);
  }

  return delivery;
}
