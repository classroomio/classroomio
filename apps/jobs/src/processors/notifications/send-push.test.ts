import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendPushNotificationsAsync = vi.fn();
const getPushNotificationReceiptsAsync = vi.fn();

vi.mock('expo-server-sdk', () => {
  class Expo {
    static isExpoPushToken(token: unknown) {
      return typeof token === 'string' && token.startsWith('ExponentPushToken[');
    }

    chunkPushNotifications<T>(messages: T[]) {
      return messages.length ? [messages] : [];
    }

    chunkPushNotificationReceiptIds<T>(ids: T[]) {
      return ids.length ? [ids] : [];
    }

    sendPushNotificationsAsync = sendPushNotificationsAsync;
    getPushNotificationReceiptsAsync = getPushNotificationReceiptsAsync;
  }

  return { Expo };
});

vi.mock('@cio/db/queries/notifications/device-token', () => ({
  disableDeviceTokens: vi.fn(async (tokens: string[]) => tokens.length),
  listActiveDeviceTokens: vi.fn()
}));
vi.mock('@cio/db/queries/notifications/notification', () => ({
  countUnreadNotificationsByProfile: vi.fn(async () => new Map()),
  getNotificationsByIds: vi.fn()
}));
vi.mock('@cio/db/queries/notifications/notification-preferences', () => ({
  listNotificationPreferences: vi.fn(async () => []),
  listQuietHours: vi.fn(async () => [])
}));
vi.mock('@cio/db/queries/notifications/notification-subjects', () => ({
  loadNotificationSubjects: vi.fn(async () => new Map())
}));
vi.mock('@cio/db/queries/notifications/notification-recipients', () => ({
  listProfileLocales: vi.fn(async () => new Map())
}));
vi.mock('@cio/core/services/notification/push-config', () => ({
  isPushConfigured: vi.fn(() => true),
  expoAccessToken: vi.fn(() => undefined)
}));
vi.mock('@cio/jobs', async () => {
  const { z } = await import('zod');

  return {
    ZSendPushPayload: z.object({ notificationIds: z.array(z.string()), deferred: z.boolean().optional() }),
    ZCheckPushReceiptsPayload: z.object({ receipts: z.array(z.object({ receiptId: z.string(), token: z.string() })) }),
    enqueueSendPush: vi.fn(),
    enqueueCheckPushReceipts: vi.fn()
  };
});
vi.mock('../../utils/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import { disableDeviceTokens, listActiveDeviceTokens } from '@cio/db/queries/notifications/device-token';
import { getNotificationsByIds } from '@cio/db/queries/notifications/notification';
import { listProfileLocales } from '@cio/db/queries/notifications/notification-recipients';
import { loadNotificationSubjects } from '@cio/db/queries/notifications/notification-subjects';
import { enqueueCheckPushReceipts } from '@cio/jobs';

import { processCheckPushReceipts, processSendPush, unregisteredTokens } from './send-push';

const notificationRow = {
  id: '00000000-0000-4000-8000-000000000001',
  profileId: 'student-a',
  organizationId: 'org-1',
  type: 'newsfeed_post',
  entityType: 'newsfeed_post',
  entityId: 'feed-1',
  courseId: 'course-1',
  actorProfileId: null,
  dedupeKey: null,
  readAt: null,
  createdAt: '2026-10-31T12:00:00.000Z'
};

function tokenRow(token: string) {
  return { id: token, profileId: 'student-a', token, platform: 'ios', provider: 'expo', disabledAt: null };
}

describe('unregisteredTokens', () => {
  it('returns only tokens Expo reports as DeviceNotRegistered', () => {
    expect(
      unregisteredTokens([
        { token: 'a', ticket: { status: 'ok', id: 'r1' } },
        { token: 'b', ticket: { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } } },
        { token: 'c', ticket: { status: 'error', message: 'rate', details: { error: 'MessageRateExceeded' } } }
      ])
    ).toEqual(['b']);
  });
});

describe('processSendPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNotificationsByIds).mockResolvedValue([notificationRow] as never);
  });

  it('disables unregistered and malformed tokens and schedules a receipt check for the rest', async () => {
    vi.mocked(listActiveDeviceTokens).mockResolvedValue([
      tokenRow('ExponentPushToken[ok]'),
      tokenRow('ExponentPushToken[gone]'),
      tokenRow('not-an-expo-token')
    ] as never);
    sendPushNotificationsAsync.mockResolvedValue([
      { status: 'ok', id: 'receipt-1' },
      { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }
    ]);

    const result = await processSendPush({ notificationIds: [notificationRow.id] });

    expect(sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(sendPushNotificationsAsync.mock.calls[0]![0]).toHaveLength(2);
    expect(disableDeviceTokens).toHaveBeenCalledWith(['not-an-expo-token', 'ExponentPushToken[gone]']);
    expect(enqueueCheckPushReceipts).toHaveBeenCalledWith(
      { receipts: [{ receiptId: 'receipt-1', token: 'ExponentPushToken[ok]' }] },
      expect.objectContaining({ delay: expect.any(Number) })
    );
    expect(result).toMatchObject({ sent: 1, disabledTokens: 2 });
  });

  it('renders each push in the recipient profile language and keeps the course title as written', async () => {
    vi.mocked(listActiveDeviceTokens).mockResolvedValue([tokenRow('ExponentPushToken[ok]')] as never);
    vi.mocked(listProfileLocales).mockResolvedValue(new Map([['student-a', 'de']]));
    vi.mocked(loadNotificationSubjects).mockResolvedValue(
      new Map([
        [
          notificationRow.id,
          {
            courseTitle: 'SOC 2 Basics',
            actorName: 'Daniel Mensah',
            actorAvatarUrl: null,
            subjectTitle: null,
            subjectSlug: null,
            dueAt: null,
            startsAt: null,
            completedCount: null,
            requiredCount: null
          }
        ]
      ])
    );
    sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok', id: 'receipt-1' }]);

    await processSendPush({ notificationIds: [notificationRow.id] });

    expect(listProfileLocales).toHaveBeenCalledWith(['student-a']);
    expect(sendPushNotificationsAsync.mock.calls[0]![0]).toEqual([
      expect.objectContaining({ title: 'Neuer Beitrag in SOC 2 Basics', body: 'Von Daniel Mensah' })
    ]);
  });

  it('falls back to English when the recipient has no language', async () => {
    vi.mocked(listActiveDeviceTokens).mockResolvedValue([tokenRow('ExponentPushToken[ok]')] as never);
    vi.mocked(listProfileLocales).mockResolvedValue(new Map());
    vi.mocked(loadNotificationSubjects).mockResolvedValue(new Map());
    sendPushNotificationsAsync.mockResolvedValue([{ status: 'ok', id: 'receipt-1' }]);

    await processSendPush({ notificationIds: [notificationRow.id] });

    expect(sendPushNotificationsAsync.mock.calls[0]![0]).toEqual([
      expect.objectContaining({ title: 'New post in your course' })
    ]);
  });
});

describe('processCheckPushReceipts', () => {
  it('disables tokens whose receipts report DeviceNotRegistered', async () => {
    getPushNotificationReceiptsAsync.mockResolvedValue({
      r1: { status: 'ok' },
      r2: { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }
    });

    const result = await processCheckPushReceipts({
      receipts: [
        { receiptId: 'r1', token: 'ExponentPushToken[ok]' },
        { receiptId: 'r2', token: 'ExponentPushToken[gone]' }
      ]
    });

    expect(disableDeviceTokens).toHaveBeenCalledWith(['ExponentPushToken[gone]']);
    expect(result).toEqual({ checked: 2, disabledTokens: 1 });
  });
});
