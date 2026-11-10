import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  zapierGet: vi.fn(),
  deleteConnection: vi.fn(),
  snackbarSuccess: vi.fn(),
  snackbarError: vi.fn()
}));

vi.mock('$lib/utils/services/api', () => {
  class BaseApiWithErrors {
    isLoading = false;
    error: string | null = null;
    async execute<T>({ requestFn, onSuccess, onError }: any) {
      try {
        const response = await requestFn();
        if (response.ok) {
          const body = await response.json();
          onSuccess?.(body);
          return body;
        }
        onError?.(response);
      } catch (e) {
        onError?.(e);
      }
      return null;
    }
  }

  const classroomio = {
    organization: {
      automation: {
        zapier: {
          $get: mocks.zapierGet
        },
        'connected-apps': {
          ':consentId': {
            $delete: mocks.deleteConnection
          }
        }
      }
    }
  };

  return { BaseApiWithErrors, classroomio };
});

vi.mock('$features/ui/snackbar/store', () => ({
  snackbar: {
    success: mocks.snackbarSuccess,
    error: mocks.snackbarError
  }
}));

import { zapierApi } from './zapier.svelte';

describe('zapierApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    zapierApi.resetOrganizationState();
  });

  it('loads Zapier overview connections and limits', async () => {
    const overviewData = {
      connections: [
        {
          consentId: 'consent-1',
          authorizedBy: { profileId: 'user-1', fullname: 'Admin' },
          scopes: ['course:read'],
          connectedAt: '2026-01-01T00:00:00.000Z',
          lastUsedAt: null,
          triggers: [
            {
              id: 'trig-1',
              eventType: 'course.completed',
              courseId: null,
              courseTitle: null,
              cohortId: null,
              health: 'healthy',
              isActive: true,
              lastDeliveryStatus: null,
              lastDeliveryAt: null,
              createdAt: '2026-01-01T00:00:00.000Z'
            }
          ]
        }
      ],
      limits: {
        maxTriggerSubscriptions: 50,
        activeTriggerSubscriptions: 1
      }
    };

    mocks.zapierGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: overviewData })
    });

    await zapierApi.load();

    expect(zapierApi.overview).toEqual(overviewData);
  });

  it('removes a connection and updates overview active triggers', async () => {
    const overviewData = {
      connections: [
        {
          consentId: 'consent-1',
          authorizedBy: { profileId: 'user-1', fullname: 'Admin' },
          scopes: ['course:read'],
          connectedAt: '2026-01-01T00:00:00.000Z',
          lastUsedAt: null,
          triggers: [
            {
              id: 'trig-1',
              eventType: 'course.completed',
              courseId: null,
              courseTitle: null,
              cohortId: null,
              health: 'healthy',
              isActive: true,
              lastDeliveryStatus: null,
              lastDeliveryAt: null,
              createdAt: '2026-01-01T00:00:00.000Z'
            }
          ]
        }
      ],
      limits: {
        maxTriggerSubscriptions: 50,
        activeTriggerSubscriptions: 1
      }
    };

    mocks.zapierGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: overviewData })
    });
    mocks.deleteConnection.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { consentId: 'consent-1' } })
    });

    await zapierApi.load();
    await zapierApi.removeConnection('consent-1');

    expect(mocks.deleteConnection).toHaveBeenCalledWith({ param: { consentId: 'consent-1' } });
    expect(zapierApi.overview?.connections).toHaveLength(0);
    expect(zapierApi.overview?.limits.activeTriggerSubscriptions).toBe(0);
    expect(mocks.snackbarSuccess).toHaveBeenCalledWith('snackbar.zapier.removed');
  });

  it('shows an error message when removing a connection fails', async () => {
    mocks.deleteConnection.mockRejectedValue(new Error('Network error'));

    await zapierApi.removeConnection('consent-1');

    expect(mocks.snackbarError).toHaveBeenCalledWith('snackbar.zapier.remove_failed');
  });

  it('resets organization state cleanly', async () => {
    zapierApi.overview = {
      connections: [],
      limits: { maxTriggerSubscriptions: 0, activeTriggerSubscriptions: 0 }
    };

    zapierApi.resetOrganizationState();
    expect(zapierApi.overview).toBeNull();
  });

  it('leaves overview empty on load error so the page can show a retry state', async () => {
    mocks.zapierGet.mockRejectedValue(new Error('Network error'));

    await zapierApi.load();

    expect(zapierApi.overview).toBeNull();
  });

  it('ignores stale load responses when a new request is initiated', async () => {
    let resolveFirst: any;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    mocks.zapierGet
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            connections: [],
            limits: { maxTriggerSubscriptions: 50, activeTriggerSubscriptions: 5 }
          }
        })
      });

    const firstLoad = zapierApi.load();
    const secondLoad = zapierApi.load();

    await secondLoad;
    expect(zapierApi.overview?.limits.activeTriggerSubscriptions).toBe(5);

    resolveFirst({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          connections: [],
          limits: { maxTriggerSubscriptions: 50, activeTriggerSubscriptions: 999 }
        }
      })
    });
    await firstLoad;

    expect(zapierApi.overview?.limits.activeTriggerSubscriptions).toBe(5);
  });
});
