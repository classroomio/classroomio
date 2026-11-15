export function sendBeacon(endpoint: string, payload: unknown): boolean {
  if (typeof window === 'undefined') return false;

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return true;
    } catch {
      // fall through to fetch
    }
  }

  if (typeof fetch === 'function') {
    fetch(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {
      // analytics must never throw
    });
    return true;
  }

  return false;
}
