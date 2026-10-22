import { gzipSync } from 'fflate';

export const BEACON_BYTE_LIMIT = 60 * 1024;
export const KEEPALIVE_BYTE_LIMIT = 64 * 1024;

const PENDING_SAVE_KEY = 'cio:scorm:pending-exit-saves';
const PENDING_SAVE_MAX = 4;

export const GZIP_BODY_HEADER = 'X-Cio-Body-Encoding';
export const SAVE_REPLAY_WINDOW_MS = 30 * 86_400_000;

type PendingExitSave = { id: string; url: string; body: string };

function beaconBodyBytes(data: BodyInit | null | undefined): number | null {
  if (data === null || data === undefined) return 0;

  if (typeof data === 'string') return new TextEncoder().encode(data).length;

  if (data instanceof Blob) return data.size;

  if (data instanceof ArrayBuffer) return data.byteLength;

  if (ArrayBuffer.isView(data)) return data.byteLength;

  return null;
}

function pendingStore(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readPendingSaves(): PendingExitSave[] {
  const store = pendingStore();
  if (!store) return [];

  try {
    const raw = store.getItem(PENDING_SAVE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry) => {
      if (typeof entry !== 'object' || entry === null) return [];

      const { id, url, body } = entry as { id?: unknown; url?: unknown; body?: unknown };
      if (typeof url !== 'string' || typeof body !== 'string') return [];

      return [
        {
          id: typeof id === 'string' && id ? id : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          url,
          body
        }
      ];
    });
  } catch {
    return [];
  }
}

/**
 * Stores the queue, newest entries last. When storage is full, drops the
 * oldest entries until the rest fit. Returns false when not even the newest
 * entry could be stored.
 */
function writePendingSaves(entries: PendingExitSave[]): boolean {
  const store = pendingStore();
  if (!store) return false;

  try {
    if (entries.length === 0) {
      store.removeItem(PENDING_SAVE_KEY);
      return true;
    }
  } catch {
    return false;
  }

  for (let kept = Math.min(entries.length, PENDING_SAVE_MAX); kept > 0; kept -= 1) {
    try {
      store.setItem(PENDING_SAVE_KEY, JSON.stringify(entries.slice(-kept)));
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

function queuePendingSave(url: string, body: string): PendingExitSave | null {
  const entries = readPendingSaves();
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, url, body };
  entries.push(entry);

  return writePendingSaves(entries) ? entry : null;
}

function dataAsText(data: BodyInit | null | undefined): string | null {
  if (data === null || data === undefined) return '';

  if (typeof data === 'string') return data;

  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);

  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data);

  return null;
}

function removePendingSave(id: string): void {
  const entries = readPendingSaves();
  const remaining = entries.filter((entry) => entry.id !== id);

  if (remaining.length !== entries.length) writePendingSaves(remaining);
}

function sendKeepalive(url: string, body: BodyInit, headers: Record<string, string>, pendingId?: string): boolean {
  try {
    void fetch(url, { method: 'POST', body, headers, keepalive: true, credentials: 'include' })
      .then((response) => {
        if (response.ok && pendingId) removePendingSave(pendingId);
      })
      .catch(() => {});

    return true;
  } catch {
    return false;
  }
}

/**
 * Delivers a save too large for sendBeacon. Text bodies are gzipped so they
 * fit the keepalive budget, and stored first so the next launch replays them
 * if the request never lands. Returns true when the save was sent or stored.
 */
function sendOversizedSave(url: string, data: BodyInit | null, bytes: number): boolean {
  const text = dataAsText(data);

  if (text === null) {
    return bytes <= KEEPALIVE_BYTE_LIMIT && data !== null && sendKeepalive(url, data, {});
  }

  const pending = queuePendingSave(url, text);
  const compressed = gzipSync(new TextEncoder().encode(text));

  if (compressed.byteLength > KEEPALIVE_BYTE_LIMIT) return pending !== null;

  const headers = { 'Content-Type': 'text/plain', [GZIP_BODY_HEADER]: 'gzip' };
  const sent = sendKeepalive(url, new Blob([new Uint8Array(compressed)], { type: 'text/plain' }), headers, pending?.id);

  return sent || pending !== null;
}

function tokenFromCommitUrl(url: string): string | null {
  const match = url.match(/\/activity\/scorm\/runtime\/([^/]+)\/commit/);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function readTokenClaims(token: string): { sub?: unknown; exp?: unknown } | null {
  const [body] = token.split('.');
  if (!body) return null;

  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(json, (char) => char.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));

    return typeof claims === 'object' && claims !== null ? (claims as { sub?: unknown; exp?: unknown }) : null;
  } catch {
    return null;
  }
}

function isPastReplayWindow(claims: { exp?: unknown }, nowMs: number): boolean {
  return typeof claims.exp !== 'number' || claims.exp * 1000 + SAVE_REPLAY_WINDOW_MS <= nowMs;
}

/**
 * Sends the exit saves stored on this device under the current launch, which
 * the server needs because a stored save's own launch token may have expired.
 * Saves of another learner on the same device stay stored for them. Saves past
 * the replay window, malformed saves and saves the server answered are removed;
 * network errors, rate limits and server errors keep them for the next launch.
 */
export async function replayPendingSaves(launchToken: string, nowMs: number = Date.now()): Promise<void> {
  const entries = readPendingSaves();
  if (entries.length === 0) return;

  const currentSub = readTokenClaims(launchToken)?.sub;
  const settledIds = new Set<string>();

  for (const entry of entries) {
    const originalToken = tokenFromCommitUrl(entry.url);
    const claims = originalToken ? readTokenClaims(originalToken) : null;

    if (!originalToken || !claims || isPastReplayWindow(claims, nowMs)) {
      settledIds.add(entry.id);
      continue;
    }

    if (currentSub === undefined || claims.sub !== currentSub) continue;

    let commit: unknown;
    try {
      commit = JSON.parse(entry.body);
    } catch {
      settledIds.add(entry.id);
      continue;
    }

    try {
      const response = await fetch(`/activity/scorm/runtime/${encodeURIComponent(launchToken)}/replay`, {
        method: 'POST',
        body: JSON.stringify({ originalToken, commit }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status < 500 && response.status !== 429) settledIds.add(entry.id);
    } catch {
      continue;
    }
  }

  if (settledIds.size === 0) return;

  const remaining = readPendingSaves().filter((entry) => !settledIds.has(entry.id));
  writePendingSaves(remaining);
}

/**
 * Routes run-time saves around sendBeacon's drop limit. Payloads at or under
 * the limit keep native beacon delivery; larger ones are stored for replay and
 * sent gzipped as a keepalive fetch. Browsers cap unload requests at 64 KiB,
 * so a save still larger once compressed waits for `replayPendingSaves` on
 * the next launch.
 */
export function installLargeBeaconFetchFallback(limit: number = BEACON_BYTE_LIMIT): void {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;

  const nativeSendBeacon = navigator.sendBeacon.bind(navigator);

  navigator.sendBeacon = (url: string | URL, data?: BodyInit | null): boolean => {
    const target = String(url);

    if (!target.includes('/activity/scorm/runtime/')) {
      return data === undefined ? nativeSendBeacon(target) : nativeSendBeacon(target, data);
    }

    const bytes = beaconBodyBytes(data ?? null);

    if (bytes === null || bytes <= limit) {
      return data === undefined ? nativeSendBeacon(target) : nativeSendBeacon(target, data);
    }

    return sendOversizedSave(target, data ?? null, bytes);
  };
}
