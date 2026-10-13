import { randomUUID } from 'node:crypto';

import {
  claimNextDueWebhookDelivery,
  getEarliestPendingWebhookAttemptAt,
  getWebhookEndpointById,
  recordWebhookAttempt,
  withWebhookEndpointLock,
  type TWebhookAttemptResult
} from '@cio/db/queries/webhook';
import type { TWebhookDelivery, TWebhookEndpoint, TWebhookEvent } from '@cio/db/types';
import { enqueueWebhookDelivery } from '@cio/jobs';
import {
  WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD,
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_RESPONSE_BODY_LIMIT,
  WEBHOOK_RETRY_DELAYS_MS,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER
} from '@cio/utils/constants/webhook';

import { getWebhookUrlPolicy } from './policy';
import { redactSensitiveText, truncateText } from './redact';
import { decryptWebhookSecret } from './secret';
import { sendWebhookRequest } from './send';
import { signWebhookPayload } from './signature';
import { assertWebhookUrlShape, WebhookUrlError } from './url-guard';

const LOCK_BUSY_RETRY_MS = 5_000;
const MAX_DELIVERIES_PER_RUN = 25;

export function createWebhookRecordId(prefix: 'evt' | 'whd'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

export function buildWebhookRequestHeaders(
  endpoint: TWebhookEndpoint,
  event: TWebhookEvent,
  deliveryId: string,
  body: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ClassroomIO-Webhooks/1.0',
    'X-Cio-Event': event.eventType,
    'X-Cio-Event-Id': event.id,
    'X-Cio-Delivery': deliveryId,
    'X-Cio-Webhook': endpoint.id,
    [WEBHOOK_TIMESTAMP_HEADER]: String(timestamp)
  };

  if (endpoint.secretCiphertext) {
    const secret = decryptWebhookSecret(endpoint.secretCiphertext);
    headers[WEBHOOK_SIGNATURE_HEADER] = signWebhookPayload(secret, timestamp, body);
  }

  return headers;
}

/**
 * Performs one HTTP attempt and returns the outcome plus when (if ever) to retry.
 * `allowRetry: false` makes the first failure terminal, used for admin test sends.
 */
export async function attemptWebhookDelivery(
  endpoint: TWebhookEndpoint,
  delivery: Pick<TWebhookDelivery, 'id' | 'attempt'>,
  event: TWebhookEvent,
  options: { allowRetry: boolean } = { allowRetry: true }
): Promise<TWebhookAttemptResult> {
  const attempt = delivery.attempt + 1;
  const body = JSON.stringify(event.payload);
  const policy = getWebhookUrlPolicy();
  const headers = buildWebhookRequestHeaders(endpoint, event, delivery.id, body);

  let sendResult: Awaited<ReturnType<typeof sendWebhookRequest>>;

  try {
    sendResult = await sendWebhookRequest({
      url: assertWebhookUrlShape(endpoint.payloadUrl, policy),
      body,
      headers,
      verifySsl: endpoint.verifySsl,
      policy
    });
  } catch (error) {
    const message = error instanceof WebhookUrlError ? error.message : 'Failed to send webhook request';
    sendResult = { responseStatus: null, responseBody: null, errorMessage: message, durationMs: 0 };
  }

  const success =
    !sendResult.errorMessage &&
    sendResult.responseStatus !== null &&
    sendResult.responseStatus >= 200 &&
    sendResult.responseStatus < 300;

  const retryDelayMs = WEBHOOK_RETRY_DELAYS_MS[attempt - 1];
  const canRetry = options.allowRetry && attempt < WEBHOOK_MAX_ATTEMPTS && retryDelayMs !== undefined;
  const errorMessage =
    sendResult.errorMessage ?? (success ? null : `Endpoint responded with HTTP ${sendResult.responseStatus}`);

  return {
    success,
    attempt,
    responseStatus: sendResult.responseStatus,
    responseBody: sendResult.responseBody
      ? truncateText(redactSensitiveText(sendResult.responseBody), WEBHOOK_RESPONSE_BODY_LIMIT)
      : null,
    errorMessage,
    durationMs: sendResult.durationMs,
    requestHeaders: headers,
    nextAttemptAt: !success && canRetry ? new Date(Date.now() + retryDelayMs) : null,
    failureThreshold: WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD
  };
}

/**
 * Drains every due delivery for the endpoint (oldest first, one in flight at a time), then schedules
 * the next run for the earliest pending retry. Safe to call concurrently and repeatedly.
 */
export async function processWebhookEndpoint(webhookId: string): Promise<{ processed: number }> {
  const processed = await withWebhookEndpointLock(webhookId, async (tx) => {
    let count = 0;

    while (count < MAX_DELIVERIES_PER_RUN) {
      const record = await claimNextDueWebhookDelivery(webhookId, tx);

      if (!record) break;

      const endpoint = await getWebhookEndpointById(webhookId, tx);

      if (!endpoint) break;

      count += 1;

      if (!endpoint.isActive && !record.delivery.isTest) {
        const skipped: TWebhookAttemptResult = {
          success: false,
          attempt: record.delivery.attempt,
          responseStatus: null,
          responseBody: null,
          errorMessage: 'Endpoint is disabled',
          durationMs: 0,
          requestHeaders: {},
          nextAttemptAt: null,
          failureThreshold: WEBHOOK_AUTO_DISABLE_FAILURE_THRESHOLD
        };
        await recordWebhookAttempt(record.delivery.id, webhookId, false, skipped, tx);

        continue;
      }

      const result = await attemptWebhookDelivery(endpoint, record.delivery, record.event);
      await recordWebhookAttempt(record.delivery.id, webhookId, !record.delivery.isTest, result, tx);
    }

    const nextAttemptAt = await getEarliestPendingWebhookAttemptAt(webhookId, tx);

    return { count, nextAttemptAt };
  });

  if (!processed) {
    await enqueueWebhookDelivery({ webhookId }, { delayMs: LOCK_BUSY_RETRY_MS });

    return { processed: 0 };
  }

  if (processed.nextAttemptAt) {
    const delayMs = Math.max(0, processed.nextAttemptAt.getTime() - Date.now());
    await enqueueWebhookDelivery({ webhookId }, { delayMs });
  }

  return { processed: processed.count };
}
