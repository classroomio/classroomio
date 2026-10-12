import type { Scorm12API } from 'scorm-again/scorm12';
import type { Scorm2004API } from 'scorm-again/scorm2004';

import { initializeEventName, terminateEventName, type ScormAdapter, type ScormFormat } from './scorm/adapter';

export type PlayerOutboundMessage =
  | { type: 'ready' }
  | { type: 'terminated'; navRequest: string | null }
  | { type: 'did-not-connect' };

export const DID_NOT_CONNECT_MS = 30_000;

function postMessage(message: PlayerOutboundMessage, parentOrigin: string | string[]): void {
  const origins = Array.isArray(parentOrigin) ? parentOrigin : [parentOrigin];

  for (const origin of origins) {
    if (!origin) continue;

    if (window.opener && window.opener !== window) {
      window.opener.postMessage(message, origin);
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, origin);
    }
  }
}

/**
 * Posts UI events to the exact parent origin. Never exposes run-time state.
 */
export function connectParentBridge(
  adapter: ScormAdapter,
  format: ScormFormat,
  parentOrigin: string | string[],
  onTerminated?: (navRequest: string | null) => void
): void {
  let navRequest: string | null = null;

  if (format === 'scorm2004') {
    adapter.on('SetValue.adl.nav.request', (_element: string, value: unknown) => {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      navRequest = trimmed === '' || trimmed === '_none_' ? null : trimmed;
    });
  }

  adapter.on('BeforeTerminate', () => {
    if (!navRequest) {
      navRequest = readNavRequest(adapter, format);
    }
  });

  adapter.on(terminateEventName(format), () => {
    postMessage({ type: 'terminated', navRequest }, parentOrigin);
    onTerminated?.(navRequest);
  });

  postMessage({ type: 'ready' }, parentOrigin);
}

function readNavRequest(adapter: ScormAdapter, format: ScormFormat): string | null {
  if (format === 'scorm12') {
    return null;
  }

  try {
    const raw = (adapter as unknown as { adl?: { nav?: { _request?: unknown } } }).adl?.nav?._request;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return trimmed === '' || trimmed === '_none_' ? null : trimmed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Reports packages that never call Initialize. Resolves true when initialization is seen.
 */
export function watchForConnection(
  adapter: ScormAdapter,
  format: ScormFormat,
  parentOrigin: string | string[],
  timeoutMs = DID_NOT_CONNECT_MS
): Promise<boolean> {
  return new Promise((resolve) => {
    if (adapter.isInitialized()) {
      resolve(true);
      return;
    }

    const timer = window.setTimeout(() => {
      postMessage({ type: 'did-not-connect' }, parentOrigin);
      resolve(false);
    }, timeoutMs);

    adapter.on(initializeEventName(format), () => {
      window.clearTimeout(timer);
      resolve(true);
    });
  });
}

/**
 * Saves unsent state when the page closes. No-ops once the API terminated or before initialization.
 */
export function flushOnPageHide(adapter: ScormAdapter, format: ScormFormat): void {
  window.addEventListener('pagehide', () => {
    if (!adapter.isInitialized() || adapter.isTerminated()) {
      return;
    }

    try {
      if (format === 'scorm12') {
        (adapter as Scorm12API).LMSFinish('');
      } else {
        (adapter as Scorm2004API).Terminate('');
      }
    } catch {
      return;
    }
  });
}
