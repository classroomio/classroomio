import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';

import { disableDeviceTokens, listActiveDeviceTokens } from '@cio/db/queries/notifications/device-token';
import { countUnreadNotificationsByProfile, getNotificationsByIds } from '@cio/db/queries/notifications/notification';
import { listNotificationPreferences, listQuietHours } from '@cio/db/queries/notifications/notification-preferences';
import {
  listActiveOrganizationMembershipKeys,
  listProfileLocales
} from '@cio/db/queries/notifications/notification-recipients';
import { loadNotificationSubjects } from '@cio/db/queries/notifications/notification-subjects';
import { expoAccessToken, isPushConfigured } from '@cio/core/services/notification/push-config';
import { planPushDelivery, type PushMessage } from '@cio/core/services/notification/push-plan';
import type { TNotification } from '@cio/db/types';
import {
  ZCheckPushReceiptsPayload,
  ZSendPushPayload,
  enqueueCheckPushReceipts,
  enqueueSendPush,
  type TSendPushPayload
} from '@cio/jobs';

import { log } from '../../utils/logger';

const RECEIPT_CHECK_DELAY_MS = 15 * 60_000;

const MAX_SEND_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 30_000;

let client: Expo | null = null;

function expoClient(): Expo {
  client ??= new Expo({ accessToken: expoAccessToken() });

  return client;
}

type SendPushResult = {
  sent: number;
  deferred: number;
  skipped: number;
  disabledTokens: number;
};

/** Tokens whose ticket or receipt says the device no longer accepts pushes. */
export function unregisteredTokens(entries: Array<{ token: string; ticket: ExpoPushTicket }>): string[] {
  return entries
    .filter(({ ticket }) => ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered')
    .map(({ token, ticket }) => (ticket.status === 'error' ? ticket.details?.expoPushToken : undefined) ?? token);
}

function deliveryKey(notificationId: string, token: string) {
  return `${notificationId}:${token}`;
}

async function sendMessages(messages: PushMessage[]) {
  const expo = expoClient();
  const valid = messages.filter((message) => Expo.isExpoPushToken(message.to));
  const invalidTokens = messages.filter((message) => !Expo.isExpoPushToken(message.to)).map((message) => message.to);
  const sent: Array<{ token: string; ticket: ExpoPushTicket }> = [];
  const failed: PushMessage[] = [];

  for (const chunk of expo.chunkPushNotifications(valid as ExpoPushMessage[])) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, index) => sent.push({ token: String(chunk[index]!.to), ticket }));
    } catch (error) {
      failed.push(...(chunk as PushMessage[]));
      log.error('send-push-chunk-failed', {
        size: chunk.length,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { sent, invalidTokens, failed };
}

/** Re-queues only the pushes whose chunk Expo refused, with backoff, until the attempt limit. */
async function retryFailedMessages(failed: PushMessage[], payload: TSendPushPayload) {
  if (failed.length === 0) return;

  const attempt = payload.attempt ?? 1;
  if (attempt >= MAX_SEND_ATTEMPTS) {
    log.error('send-push-gave-up', { messages: failed.length, attempts: attempt });
    return;
  }

  const deliveries = failed.map((message) => ({ notificationId: message.data.notificationId, token: message.to }));
  const notificationIds = [...new Set(deliveries.map((delivery) => delivery.notificationId))];
  const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);

  await enqueueSendPush({ notificationIds, deliveries, attempt: attempt + 1, deferred: payload.deferred }, { delay });
}

/** Drops notifications whose recipient has since left the organization, before their details are loaded. */
async function withCurrentMembers(notifications: TNotification[]) {
  const memberships = notifications.map((notification) => ({
    organizationId: notification.organizationId,
    profileId: notification.profileId
  }));
  const active = await listActiveOrganizationMembershipKeys(memberships);

  return notifications.filter((notification) => active.has(`${notification.organizationId}:${notification.profileId}`));
}

/**
 * Process a `notifications:send-push` job: drops recipients who are no longer members of the organization, loads the
 * rest's preferences, quiet hours, languages and device tokens, renders each push in the recipient's language, sends
 * through Expo in chunks, re-queues pushes held by quiet hours and pushes whose chunk failed, disables tokens Expo
 * reports as unregistered, and schedules a receipt check for the rest.
 */
export async function processSendPush(rawPayload: unknown): Promise<SendPushResult> {
  const payload = ZSendPushPayload.parse(rawPayload);

  if (!isPushConfigured()) {
    return { sent: 0, deferred: 0, skipped: payload.notificationIds.length, disabledTokens: 0 };
  }

  const loaded = await getNotificationsByIds(payload.notificationIds);
  const notifications = await withCurrentMembers(loaded);
  const removedMembers = loaded.length - notifications.length;
  const profileIds = [...new Set(notifications.map((notification) => notification.profileId))];

  const [subjects, preferences, quietHours, tokens, unreadByProfile, localeByProfile] = await Promise.all([
    loadNotificationSubjects(notifications),
    listNotificationPreferences(profileIds),
    listQuietHours(profileIds),
    listActiveDeviceTokens(profileIds),
    countUnreadNotificationsByProfile(profileIds),
    listProfileLocales(profileIds)
  ]);

  const plan = planPushDelivery({
    notifications,
    subjects,
    preferences,
    quietHours,
    tokens,
    unreadByProfile,
    localeByProfile,
    deferred: payload.deferred ?? false,
    now: new Date()
  });

  for (const deferral of plan.deferrals) {
    const deliveries = payload.deliveries?.filter((delivery) =>
      deferral.notificationIds.includes(delivery.notificationId)
    );
    await enqueueSendPush(
      { notificationIds: deferral.notificationIds, deferred: true, ...(deliveries ? { deliveries } : {}) },
      { delay: deferral.delayMs }
    );
  }

  const allowedDeliveries = payload.deliveries
    ? new Set(payload.deliveries.map((delivery) => deliveryKey(delivery.notificationId, delivery.token)))
    : null;
  const messages = allowedDeliveries
    ? plan.messages.filter((message) => allowedDeliveries.has(deliveryKey(message.data.notificationId, message.to)))
    : plan.messages;

  const { sent, invalidTokens, failed } =
    messages.length > 0 ? await sendMessages(messages) : { sent: [], invalidTokens: [], failed: [] };
  await retryFailedMessages(failed, payload);
  const disabledTokens = await disableDeviceTokens([...invalidTokens, ...unregisteredTokens(sent)]);

  const receipts = sent.flatMap(({ token, ticket }) =>
    ticket.status === 'ok' ? [{ receiptId: ticket.id, token }] : []
  );
  if (receipts.length > 0) {
    await enqueueCheckPushReceipts({ receipts }, { delay: RECEIPT_CHECK_DELAY_MS });
  }

  const skipped = Object.values(plan.skipped).reduce((total, count) => total + count, removedMembers);
  const deferred = plan.deferrals.reduce((total, deferral) => total + deferral.notificationIds.length, 0);
  const delivered = sent.filter(({ ticket }) => ticket.status === 'ok').length;

  log.info('send-push-done', {
    notifications: notifications.length,
    sent: delivered,
    deferred,
    skipped,
    failed: failed.length,
    disabledTokens
  });

  return { sent: delivered, deferred, skipped, disabledTokens };
}

/** Process a `notifications:check-push-receipts` job: disables tokens whose receipts report DeviceNotRegistered. */
export async function processCheckPushReceipts(
  rawPayload: unknown
): Promise<{ checked: number; disabledTokens: number }> {
  const payload = ZCheckPushReceiptsPayload.parse(rawPayload);
  if (!isPushConfigured()) return { checked: 0, disabledTokens: 0 };

  const expo = expoClient();
  const tokenByReceipt = new Map(payload.receipts.map((receipt) => [receipt.receiptId, receipt.token]));
  const entries: Array<{ token: string; ticket: ExpoPushTicket }> = [];

  for (const chunk of expo.chunkPushNotificationReceiptIds([...tokenByReceipt.keys()])) {
    const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

    for (const [receiptId, receipt] of Object.entries(receipts)) {
      const token = tokenByReceipt.get(receiptId);
      if (token && receipt.status === 'error') entries.push({ token, ticket: receipt });
    }
  }

  const disabledTokens = await disableDeviceTokens(unregisteredTokens(entries));
  log.info('check-push-receipts-done', { checked: tokenByReceipt.size, errors: entries.length, disabledTokens });

  return { checked: tokenByReceipt.size, disabledTokens };
}
