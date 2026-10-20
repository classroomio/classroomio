import { afterEach, describe, expect, it, vi } from 'vitest';
import { BEACON_BYTE_LIMIT, KEEPALIVE_BYTE_LIMIT, installLargeBeaconFetchFallback } from './beacon-fallback';

describe('installLargeBeaconFetchFallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps small runtime saves on native sendBeacon', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });
    installLargeBeaconFetchFallback();

    const ok = navigator.sendBeacon('/activity/scorm/runtime/token/commit', new Blob(['x'.repeat(100)]));

    expect(ok).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('reroutes oversized runtime saves to a keepalive fetch', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const body = new Blob(['x'.repeat(BEACON_BYTE_LIMIT + 1)]);
    const ok = navigator.sendBeacon('/activity/scorm/runtime/token/commit', body);

    expect(ok).toBe(true);
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe('/activity/scorm/runtime/token/commit');
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
    expect(init.body).toBe(body);
  });

  it('persists runtime saves above the keepalive limit for the next launch', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    const store = new Map<string, string>();
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      }
    });
    installLargeBeaconFetchFallback();

    const body = 'x'.repeat(KEEPALIVE_BYTE_LIMIT + 1);
    const ok = navigator.sendBeacon('/activity/scorm/runtime/token/commit', body);

    expect(ok).toBe(true);
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    const queued = JSON.parse(store.get('cio:scorm:pending-exit-saves') ?? '[]') as Array<{
      url: string;
      body: string;
    }>;
    expect(queued).toHaveLength(1);
    expect(queued[0]?.url).toBe('/activity/scorm/runtime/token/commit');
    expect(queued[0]?.body).toBe(body);
  });

  it('leaves non-runtime beacons alone', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });
    installLargeBeaconFetchFallback();

    navigator.sendBeacon('/other/endpoint', new Blob(['x'.repeat(BEACON_BYTE_LIMIT + 1)]));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});
