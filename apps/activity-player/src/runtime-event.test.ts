import { describe, expect, it, vi } from 'vitest';
import { reportRuntimeEvent } from './runtime-event';

describe('reportRuntimeEvent', () => {
  it('posts player events to the run-time endpoint', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/activity/scorm/runtime/launch-token/event');
      expect(init?.method).toBe('POST');
      expect(JSON.parse((init?.body ?? '') as string)).toEqual({
        kind: 'not_initialized',
        detail: { elapsedMs: 30000 }
      });

      return new Response('{}', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await reportRuntimeEvent('launch-token', 'not_initialized', { elapsedMs: 30000 });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('never throws when the endpoint is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );

    await expect(reportRuntimeEvent('launch-token', 'error', { message: 'boot failed' })).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });
});
