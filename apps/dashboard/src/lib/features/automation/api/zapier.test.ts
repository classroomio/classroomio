import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  zapierGet: vi.fn(),
  redeliverPost: vi.fn(),
  deleteConnection: vi.fn(),
  snackbarSuccess: vi.fn(),
  snackbarError: vi.fn()
}));

vi.mock('$lib/utils/services/api', () => {
  class BaseApiWithErrors {
    isLoading = false;
    error: string | null = null;
    async execute<TResponse>({
      requestFn,
      onSuccess,
      onError
    }: {
      requestFn: () => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
      logContext?: string;
      onSuccess?: (body: TResponse) => void | Promise<void>;
      onError?: (error: unknown) => void | Promise<void>;
    }): Promise<TResponse | null> {
      try {
        const response = await requestFn();
        const body = (await response.json()) as { success: boolean };

        if (body.success === false) {
          await onError?.(body);

          return null;
        }

        await onSuccess?.(body as TResponse);

        return body as TResponse;
      } catch (e) {
        await onError?.(e);
      }

      return null;
    }
  }

  const classroomio = {
    organization: {
      automation: {
        zapier: {
          $get: mocks.zapierGet,
          triggers: {
            ':triggerId': {
              redeliver: {
                $post: mocks.redeliverPost
              }
            }
          }
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
    let resolveFirst!: (value: unknown) => void;
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

  it('leaves overview empty when the API reports success: false', async () => {
    mocks.zapierGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Forbidden' })
    });

    await zapierApi.load();

    expect(zapierApi.overview).toBeNull();
  });

  it('reloads the overview on loadOnce even when a connection list is cached', async () => {
    const overviewData = {
      connections: [],
      limits: { maxTriggerSubscriptions: 50, activeTriggerSubscriptions: 0 }
    };

    mocks.zapierGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: overviewData })
    });

    await zapierApi.load();
    expect(mocks.zapierGet).toHaveBeenCalledTimes(1);

    await zapierApi.loadOnce();
    expect(mocks.zapierGet).toHaveBeenCalledTimes(2);
  });

  it('dedupes concurrent loadOnce calls into one request', async () => {
    let resolveGet!: (value: unknown) => void;

    mocks.zapierGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        })
    );

    const first = zapierApi.loadOnce();
    const second = zapierApi.loadOnce();

    resolveGet({
      ok: true,
      json: async () => ({
        success: true,
        data: { connections: [], limits: { maxTriggerSubscriptions: 50, activeTriggerSubscriptions: 0 } }
      })
    });
    await Promise.all([first, second]);

    expect(mocks.zapierGet).toHaveBeenCalledTimes(1);
  });

  it('redelivers failed triggers, reports the redelivered count and reloads', async () => {
    mocks.redeliverPost
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { redelivered: 2 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { redelivered: 3 } }) });
    mocks.zapierGet.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { connections: [], limits: { maxTriggerSubscriptions: 50, activeTriggerSubscriptions: 0 } }
      })
    });

    await zapierApi.redeliverFailed(['trig-1', 'trig-2']);

    expect(mocks.redeliverPost).toHaveBeenCalledTimes(2);
    expect(mocks.redeliverPost).toHaveBeenCalledWith({ param: { triggerId: 'trig-1' } });
    expect(mocks.snackbarSuccess).toHaveBeenCalledTimes(1);
    expect(mocks.snackbarError).not.toHaveBeenCalled();
    expect(mocks.zapierGet).toHaveBeenCalledTimes(1);
  });

  it('reports a failure when any trigger redelivery fails', async () => {
    mocks.redeliverPost
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { redelivered: 2 } }) })
      .mockRejectedValueOnce(new Error('gone'));
    mocks.zapierGet.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { connections: [], limits: { maxTriggerSubscriptions: 50, activeTriggerSubscriptions: 0 } }
      })
    });

    await zapierApi.redeliverFailed(['trig-1', 'trig-2']);

    expect(mocks.snackbarError).toHaveBeenCalledWith('snackbar.zapier.redeliver_failed');
    expect(mocks.snackbarSuccess).not.toHaveBeenCalled();
    expect(mocks.zapierGet).toHaveBeenCalledTimes(1);
  });
});
