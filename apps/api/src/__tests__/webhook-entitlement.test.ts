import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.PUBLIC_IS_SELFHOSTED = 'false';
});

const mocks = vi.hoisted(() => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn(),
  listActiveEndpointsForEvent: vi.fn(),
  orgHasActiveWebhookEndpoint: vi.fn(),
  insertWebhookEventWithDeliveries: vi.fn(),
  claimNextDueWebhookDelivery: vi.fn(),
  getWebhookEndpointById: vi.fn(),
  getEarliestPendingWebhookAttemptAt: vi.fn(),
  recordWebhookAttempt: vi.fn(),
  enqueueWebhookDelivery: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: mocks.getActiveOrganizationPlan,
  getOrganizationById: mocks.getOrganizationById
}));

vi.mock('@cio/db/queries/webhook', () => ({
  listActiveEndpointsForEvent: mocks.listActiveEndpointsForEvent,
  orgHasActiveWebhookEndpoint: mocks.orgHasActiveWebhookEndpoint,
  insertWebhookEventWithDeliveries: mocks.insertWebhookEventWithDeliveries,
  claimNextDueWebhookDelivery: mocks.claimNextDueWebhookDelivery,
  getWebhookEndpointById: mocks.getWebhookEndpointById,
  getEarliestPendingWebhookAttemptAt: mocks.getEarliestPendingWebhookAttemptAt,
  recordWebhookAttempt: mocks.recordWebhookAttempt
}));

vi.mock('@cio/jobs', () => ({
  enqueueWebhookDelivery: mocks.enqueueWebhookDelivery,
  withRedisLock: vi.fn(async (_key: string, _ttl: number, work: () => Promise<unknown>) => ({
    acquired: true,
    value: await work()
  }))
}));

import { processWebhookEndpoint } from '@cio/core/services/webhook/deliver';
import { recordWebhookEvent } from '@cio/core/services/webhook/emit';

const orgId = '22222222-2222-4222-8222-222222222222';
const webhookId = '11111111-1111-4111-8111-111111111111';

function usePlan(planName: string | null) {
  mocks.getActiveOrganizationPlan.mockResolvedValue(planName ? { planName } : null);
}

describe('webhook plan entitlement outside the management API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEarliestPendingWebhookAttemptAt.mockResolvedValue(null);
  });

  describe('recordWebhookEvent', () => {
    beforeEach(() => {
      mocks.orgHasActiveWebhookEndpoint.mockResolvedValue(true);
      mocks.listActiveEndpointsForEvent.mockResolvedValue([{ id: webhookId }]);
    });

    it.each([['BASIC'], [null]])('records nothing for an org on the %s plan', async (planName) => {
      usePlan(planName);

      await recordWebhookEvent(orgId, 'course.completed', {
        courseId: 'c',
        memberId: 'm',
        profileId: 'p',
        completedAt: '2026-10-19T00:00:00.000Z'
      });

      expect(mocks.insertWebhookEventWithDeliveries).not.toHaveBeenCalled();
      expect(mocks.enqueueWebhookDelivery).not.toHaveBeenCalled();
    });
  });

  describe('processWebhookEndpoint', () => {
    function queueDelivery() {
      const delivery = { id: 'whd_1', attempt: 1, isTest: false };
      mocks.claimNextDueWebhookDelivery.mockResolvedValueOnce({ delivery, event: { id: 'evt_1' } });
      mocks.claimNextDueWebhookDelivery.mockResolvedValue(null);
      mocks.getWebhookEndpointById.mockResolvedValue({ id: webhookId, organizationId: orgId, isActive: true });
    }

    it('does not send a queued delivery once the org is no longer on an eligible plan', async () => {
      usePlan('BASIC');
      queueDelivery();

      await processWebhookEndpoint(webhookId);

      expect(mocks.recordWebhookAttempt).toHaveBeenCalledTimes(1);
      const [deliveryId, , affectsHealth, result] = mocks.recordWebhookAttempt.mock.calls[0];
      expect(deliveryId).toBe('whd_1');
      expect(affectsHealth).toBe(false);
      expect(result).toMatchObject({
        success: false,
        responseStatus: null,
        nextAttemptAt: null,
        errorMessage: 'Webhooks are not included in the current plan'
      });
    });
  });
});
