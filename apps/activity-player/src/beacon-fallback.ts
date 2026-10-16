export const BEACON_BYTE_LIMIT = 60 * 1024;

function beaconBodyBytes(data: BodyInit | null | undefined): number | null {
  if (data === null || data === undefined) return 0;

  if (typeof data === 'string') return new TextEncoder().encode(data).length;

  if (data instanceof Blob) return data.size;

  if (data instanceof ArrayBuffer) return data.byteLength;

  if (ArrayBuffer.isView(data)) return data.byteLength;

  return null;
}

/**
 * Routes oversized run-time saves around sendBeacon's drop limit. Payloads at
 * or under the limit keep native beacon delivery; larger ones go out as a
 * keepalive fetch with the same body so the exit save still lands.
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

    try {
      void fetch(target, { method: 'POST', body: data ?? null, keepalive: true, credentials: 'include' });

      return true;
    } catch {
      return false;
    }
  };
}
