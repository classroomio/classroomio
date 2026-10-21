export const BEACON_BYTE_LIMIT = 60 * 1024;
export const KEEPALIVE_BYTE_LIMIT = 64 * 1024;

const PENDING_SAVE_KEY = 'cio:scorm:pending-exit-saves';
const PENDING_SAVE_MAX = 4;

type PendingExitSave = { url: string; body: string };

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

      const { url, body } = entry as { url?: unknown; body?: unknown };
      if (typeof url !== 'string' || typeof body !== 'string') return [];

      return [{ url, body }];
    });
  } catch {
    return [];
  }
}

function writePendingSaves(entries: PendingExitSave[]): void {
  const store = pendingStore();
  if (!store) return;

  try {
    if (entries.length === 0) {
      store.removeItem(PENDING_SAVE_KEY);
      return;
    }

    store.setItem(PENDING_SAVE_KEY, JSON.stringify(entries.slice(-PENDING_SAVE_MAX)));
  } catch {
    return;
  }
}

function queuePendingSave(url: string, body: string): boolean {
  if (!pendingStore()) return false;

  const entries = readPendingSaves();
  entries.push({ url, body });
  writePendingSaves(entries);

  return true;
}

function dataAsText(data: BodyInit | null | undefined): string | null {
  if (data === null || data === undefined) return '';

  if (typeof data === 'string') return data;

  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);

  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data);

  return null;
}

function queueOversizedSave(url: string, data: BodyInit | null | undefined): boolean {
  const text = dataAsText(data);

  if (text !== null) return queuePendingSave(url, text);

  if (data instanceof Blob) {
    void data
      .text()
      .then((body) => queuePendingSave(url, body))
      .catch(() => {});

    return true;
  }

  return false;
}

async function flushPendingSaves(): Promise<void> {
  const entries = readPendingSaves();
  if (entries.length === 0) return;

  const remaining: PendingExitSave[] = [];

  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, {
        method: 'POST',
        body: entry.body,
        credentials: 'include',
        headers: { 'Content-Type': 'text/plain' }
      });

      if (response.status >= 500) remaining.push(entry);
    } catch {
      remaining.push(entry);
    }
  }

  const appended = readPendingSaves().slice(entries.length);
  writePendingSaves([...remaining, ...appended]);
}

/**
 * Routes run-time saves around sendBeacon's drop limit. Payloads at or under
 * the limit keep native beacon delivery; larger ones go out as a keepalive
 * fetch. Payloads above the keepalive limit cannot be delivered during unload
 * at all, so they are persisted and replayed on the next launch.
 */
export function installLargeBeaconFetchFallback(limit: number = BEACON_BYTE_LIMIT): Promise<void> {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return Promise.resolve();

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

    if (bytes > KEEPALIVE_BYTE_LIMIT) {
      return queueOversizedSave(target, data ?? null);
    }

    try {
      void fetch(target, { method: 'POST', body: data ?? null, keepalive: true, credentials: 'include' }).catch(
        () => {}
      );

      return true;
    } catch {
      return false;
    }
  };

  return flushPendingSaves().catch(() => {});
}
