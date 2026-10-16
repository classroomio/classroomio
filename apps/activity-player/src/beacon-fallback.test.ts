import { afterEach, describe, expect, it, vi } from 'vitest';
import { BEACON_BYTE_LIMIT, installLargeBeaconFetchFallback } from './beacon-fallback';

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

  it('leaves non-runtime beacons alone', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });
    installLargeBeaconFetchFallback();

    navigator.sendBeacon('/other/endpoint', new Blob(['x'.repeat(BEACON_BYTE_LIMIT + 1)]));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});
