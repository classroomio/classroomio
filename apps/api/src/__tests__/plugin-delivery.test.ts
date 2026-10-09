import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getEventDeliveryWithDetails: vi.fn(),
  recordDeliveryAttempt: vi.fn(),
  replayDeadLetterDelivery: vi.fn(),
  getEventDeliveryById: vi.fn()
}));

vi.mock('@cio/db/queries/plugin', () => ({
  getEventDeliveryWithDetails: dbMocks.getEventDeliveryWithDetails,
  recordDeliveryAttempt: dbMocks.recordDeliveryAttempt,
  replayDeadLetterDelivery: dbMocks.replayDeadLetterDelivery,
  getEventDeliveryById: dbMocks.getEventDeliveryById,
  createDeliveriesForOutboxEvent: vi.fn(),
  enqueueOutboxEvent: vi.fn(),
  fetchPendingDeliveries: vi.fn(),
  getInstallationById: vi.fn(),
  listActiveSubscriptionsForEvent: vi.fn(),
  listDeliveriesByInstallation: vi.fn(),
  listSubscriptionsByInstallation: vi.fn(),
  upsertEventSubscription: vi.fn()
}));

import { deliverEvent, replayDelivery } from '@api/services/plugin/events';

describe('Plugin Outbox Event Delivery Worker', () => {
  const deliveryRecord = {
    id: 'del-111',
    outboxEventId: 'evt-222',
    subscriptionId: 'sub-333',
    status: 'pending',
    attemptCount: 0,
    responseStatus: null,
    errorMessage: null,
    nextRetryAt: null,
    deliveredAt: null,
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z'
  };

  const outboxEvent = {
    id: 'evt-222',
    eventType: 'course.published',
    payload: { courseId: 'c-01', title: 'Intro to AI' },
    organizationId: 'org-01',
    createdAt: '2026-10-09T00:00:00Z'
  };

  const subscription = {
    id: 'sub-333',
    installationId: 'inst-01',
    eventType: 'course.published',
    endpoint: 'https://webhook.example.com/events',
    status: 'active',
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks delivery as delivered when external endpoint responds with 200 OK', async () => {
    dbMocks.getEventDeliveryWithDetails.mockResolvedValueOnce({
      delivery: { ...deliveryRecord },
      outboxEvent,
      subscription
    });

    dbMocks.recordDeliveryAttempt.mockImplementationOnce((_id, data) => ({
      ...deliveryRecord,
      ...data
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })
    );

    const result = await deliverEvent('del-111');

    expect(result.status).toBe('delivered');
    expect(result.attemptCount).toBe(1);
    expect(dbMocks.recordDeliveryAttempt).toHaveBeenCalledWith(
      'del-111',
      expect.objectContaining({
        status: 'delivered',
        attemptCount: 1,
        responseStatus: 200,
        deliveredAt: expect.any(String)
      })
    );
  });

  it('schedules retry with exponential backoff on HTTP error', async () => {
    dbMocks.getEventDeliveryWithDetails.mockResolvedValueOnce({
      delivery: { ...deliveryRecord, attemptCount: 1 },
      outboxEvent,
      subscription
    });

    dbMocks.recordDeliveryAttempt.mockImplementationOnce((_id, data) => ({
      ...deliveryRecord,
      ...data
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    );

    const result = await deliverEvent('del-111');

    expect(result.status).toBe('retry');
    expect(result.attemptCount).toBe(2);
    expect(dbMocks.recordDeliveryAttempt).toHaveBeenCalledWith(
      'del-111',
      expect.objectContaining({
        status: 'retry',
        attemptCount: 2,
        responseStatus: 500,
        errorMessage: 'HTTP error 500: Internal Server Error',
        nextRetryAt: expect.any(String)
      })
    );
  });

  it('transitions to dead_letter when maximum attempts (5) are reached', async () => {
    dbMocks.getEventDeliveryWithDetails.mockResolvedValueOnce({
      delivery: { ...deliveryRecord, attemptCount: 4 },
      outboxEvent,
      subscription
    });

    dbMocks.recordDeliveryAttempt.mockImplementationOnce((_id, data) => ({
      ...deliveryRecord,
      ...data
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })
    );

    const result = await deliverEvent('del-111');

    expect(result.status).toBe('dead_letter');
    expect(result.attemptCount).toBe(5);
    expect(dbMocks.recordDeliveryAttempt).toHaveBeenCalledWith(
      'del-111',
      expect.objectContaining({
        status: 'dead_letter',
        attemptCount: 5,
        responseStatus: 503,
        nextRetryAt: null
      })
    );
  });

  it('replays a dead letter delivery and triggers redelivery', async () => {
    dbMocks.replayDeadLetterDelivery.mockResolvedValueOnce({
      ...deliveryRecord,
      id: 'del-111',
      status: 'retry'
    });

    dbMocks.getEventDeliveryWithDetails.mockResolvedValueOnce({
      delivery: { ...deliveryRecord, attemptCount: 0 },
      outboxEvent,
      subscription
    });

    dbMocks.recordDeliveryAttempt.mockImplementationOnce((_id, data) => ({
      ...deliveryRecord,
      ...data
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })
    );

    const result = await replayDelivery('del-111');

    expect(dbMocks.replayDeadLetterDelivery).toHaveBeenCalledWith('del-111');
    expect(result.status).toBe('delivered');
  });
});
