import { gunzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BEACON_BYTE_LIMIT,
  GZIP_BODY_HEADER,
  KEEPALIVE_BYTE_LIMIT,
  SAVE_REPLAY_WINDOW_MS,
  installLargeBeaconFetchFallback,
  replayPendingSaves
} from './beacon-fallback';

const RUNTIME_URL = '/activity/scorm/runtime/token/commit';
const PENDING_KEY = 'cio:scorm:pending-exit-saves';

type FetchCall = [string, RequestInit];

function stubStore(options: { maxValueLength?: number; failAll?: boolean } = {}) {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (options.failAll) throw new DOMException('quota', 'QuotaExceededError');
      if (options.maxValueLength !== undefined && value.length > options.maxValueLength) {
        throw new DOMException('quota', 'QuotaExceededError');
      }
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    }
  });

  return store;
}

function queuedSaves(store: Map<string, string>): Array<{ id: string; url: string; body: string }> {
  return JSON.parse(store.get(PENDING_KEY) ?? '[]') as Array<{ id: string; url: string; body: string }>;
}

function incompressibleText(length: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += 65_536) {
    crypto.getRandomValues(bytes.subarray(offset, offset + 65_536));
  }

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

async function flushMicrotasks() {
  for (let index = 0; index < 5; index += 1) await Promise.resolve();
}

describe('installLargeBeaconFetchFallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps small runtime saves on native sendBeacon', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });
    installLargeBeaconFetchFallback();

    const ok = navigator.sendBeacon(RUNTIME_URL, new Blob(['x'.repeat(100)]));

    expect(ok).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('sends an oversized Blob within the keepalive budget as a keepalive fetch', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const body = new Blob(['x'.repeat(BEACON_BYTE_LIMIT + 1)]);
    const ok = navigator.sendBeacon(RUNTIME_URL, body);

    expect(ok).toBe(true);
    expect(sendBeacon).not.toHaveBeenCalled();

    const [url, init] = fetchSpy.mock.calls[0] as unknown as FetchCall;
    expect(url).toBe(RUNTIME_URL);
    expect(init.keepalive).toBe(true);
    expect(init.body).toBe(body);
  });

  it('reports failure for an oversized Blob above the keepalive budget', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const ok = navigator.sendBeacon(RUNTIME_URL, new Blob(['x'.repeat(KEEPALIVE_BYTE_LIMIT + 1)]));

    expect(ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gzips a text save above the keepalive limit and sends it during unload', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    const store = stubStore();
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const body = JSON.stringify({ cmi: { suspend_data: 'abc'.repeat(KEEPALIVE_BYTE_LIMIT) } });
    const ok = navigator.sendBeacon(RUNTIME_URL, body);

    expect(ok).toBe(true);

    const [url, init] = fetchSpy.mock.calls[0] as unknown as FetchCall;
    const headers = init.headers as Record<string, string>;
    expect(url).toBe(RUNTIME_URL);
    expect(init.keepalive).toBe(true);
    expect(headers[GZIP_BODY_HEADER]).toBe('gzip');

    const sentBytes = new Uint8Array(await (init.body as Blob).arrayBuffer());
    expect(sentBytes.byteLength).toBeLessThanOrEqual(KEEPALIVE_BYTE_LIMIT);
    expect(new TextDecoder().decode(gunzipSync(sentBytes))).toBe(body);

    await flushMicrotasks();
    expect(queuedSaves(store)).toHaveLength(0);
  });

  it('keeps the stored copy when the keepalive fetch fails', async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('network down')));
    const store = stubStore();
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const body = 'x'.repeat(BEACON_BYTE_LIMIT + 1);
    const ok = navigator.sendBeacon(RUNTIME_URL, body);
    await flushMicrotasks();

    expect(ok).toBe(true);
    expect(queuedSaves(store)).toEqual([expect.objectContaining({ url: RUNTIME_URL, body })]);
  });

  it('stores a save too large even after gzip for the next launch', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    const store = stubStore();
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const body = incompressibleText(KEEPALIVE_BYTE_LIMIT * 2);
    const ok = navigator.sendBeacon(RUNTIME_URL, body);

    expect(ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(queuedSaves(store)).toEqual([expect.objectContaining({ url: RUNTIME_URL, body })]);
  });

  it('reports failure when a save can be neither sent nor stored', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    stubStore({ failAll: true });
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const ok = navigator.sendBeacon(RUNTIME_URL, incompressibleText(KEEPALIVE_BYTE_LIMIT * 2));

    expect(ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still sends a compressible save when storage is full', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    stubStore({ failAll: true });
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal('fetch', fetchSpy);
    installLargeBeaconFetchFallback();

    const ok = navigator.sendBeacon(RUNTIME_URL, 'x'.repeat(KEEPALIVE_BYTE_LIMIT * 2));

    expect(ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('drops the oldest stored saves when storage cannot hold them all', () => {
    const store = stubStore({ maxValueLength: KEEPALIVE_BYTE_LIMIT * 5 });
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response()))
    );
    installLargeBeaconFetchFallback();

    const bodies = [0, 1, 2].map(() => incompressibleText(KEEPALIVE_BYTE_LIMIT * 2));
    const results = bodies.map((body) => navigator.sendBeacon(RUNTIME_URL, body));

    expect(results).toEqual([true, true, true]);
    expect(queuedSaves(store).map((entry) => entry.body)).toEqual([bodies[1], bodies[2]]);
  });

  it('leaves non-runtime beacons alone', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });
    installLargeBeaconFetchFallback();

    navigator.sendBeacon('/other/endpoint', new Blob(['x'.repeat(BEACON_BYTE_LIMIT + 1)]));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});

const NOW_MS = Date.parse('2026-10-22T12:00:00.000Z');

function fakeToken(claims: { sub: string; exp: number }): string {
  const body = btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${body}.signature`;
}

function storedSave(id: string, token: string, body = '{"commitSequence":3,"cmi":{"suspend_data":"x"}}') {
  return { id, url: `/activity/scorm/runtime/${encodeURIComponent(token)}/commit`, body };
}

describe('replayPendingSaves', () => {
  const currentToken = fakeToken({ sub: 'learner-1', exp: NOW_MS / 1000 + 3600 });
  const expiredToken = fakeToken({ sub: 'learner-1', exp: NOW_MS / 1000 - 86_400 });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('replays a save whose own token expired under the current launch', async () => {
    const store = stubStore();
    store.set(PENDING_KEY, JSON.stringify([storedSave('a', expiredToken)]));
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    vi.stubGlobal('fetch', fetchSpy);

    await replayPendingSaves(currentToken, NOW_MS);

    const [url, init] = fetchSpy.mock.calls[0] as unknown as FetchCall;
    expect(url).toBe(`/activity/scorm/runtime/${encodeURIComponent(currentToken)}/replay`);
    expect(JSON.parse(String(init.body))).toEqual({
      originalToken: expiredToken,
      commit: { commitSequence: 3, cmi: { suspend_data: 'x' } }
    });
    expect(store.has(PENDING_KEY)).toBe(false);
  });

  it("keeps another learner's saves stored on a shared device", async () => {
    const store = stubStore();
    const otherLearner = fakeToken({ sub: 'learner-2', exp: NOW_MS / 1000 - 60 });
    store.set(PENDING_KEY, JSON.stringify([storedSave('b', otherLearner)]));
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    vi.stubGlobal('fetch', fetchSpy);

    await replayPendingSaves(currentToken, NOW_MS);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(queuedSaves(store).map((entry) => entry.id)).toEqual(['b']);
  });

  it('drops saves past the replay window and malformed saves without sending them', async () => {
    const store = stubStore();
    const tooOld = fakeToken({ sub: 'learner-1', exp: (NOW_MS - SAVE_REPLAY_WINDOW_MS) / 1000 - 1 });
    store.set(
      PENDING_KEY,
      JSON.stringify([storedSave('old', tooOld), storedSave('bad', expiredToken, 'not json'), storedSave('c', 'x')])
    );
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    vi.stubGlobal('fetch', fetchSpy);

    await replayPendingSaves(currentToken, NOW_MS);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(store.has(PENDING_KEY)).toBe(false);
  });

  it('keeps saves for the next launch on network errors, rate limits and server errors', async () => {
    const store = stubStore();
    store.set(
      PENDING_KEY,
      JSON.stringify([
        storedSave('net', expiredToken),
        storedSave('rate', expiredToken),
        storedSave('5xx', expiredToken)
      ])
    );
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetchSpy);

    await replayPendingSaves(currentToken, NOW_MS);

    expect(queuedSaves(store).map((entry) => entry.id)).toEqual(['net', 'rate', '5xx']);
  });

  it('removes a save the server refused, such as one for another org', async () => {
    const store = stubStore();
    store.set(PENDING_KEY, JSON.stringify([storedSave('a', expiredToken)]));
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 403 })))
    );

    await replayPendingSaves(currentToken, NOW_MS);

    expect(store.has(PENDING_KEY)).toBe(false);
  });
});
