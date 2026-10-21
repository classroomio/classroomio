import type { Scorm12API } from 'scorm-again/scorm12';
import type { Scorm2004API } from 'scorm-again/scorm2004';

import { initializeEventName, terminateEventName, type ScormAdapter, type ScormFormat } from './scorm/adapter';

export type PlayerNavAction = 'previous' | 'next' | 'select';

export type PlayerOutboundMessage =
  | { type: 'ready' }
  | { type: 'content-loaded' }
  | { type: 'initialized' }
  | { type: 'terminated'; navRequest: string | null }
  | { type: 'completed' }
  | { type: 'progress' }
  | { type: 'did-not-connect' }
  | { type: 'boot-error'; error: string | null }
  | { type: 'nav'; action: PlayerNavAction; identifier: string | null }
  | { type: 'exit-immersive' }
  | { type: 'fullscreen-unavailable' };

/**
 * Where one module session posts: the embedder origins from its launch state,
 * and the session number the embedder assigned when it loaded the module.
 */
export interface ParentChannel {
  origins: string[];
  session: number;
}

export type ParentTarget = string | string[] | ParentChannel;

export const DID_NOT_CONNECT_MS = 30_000;

function resolveTarget(target: ParentTarget): { origins: string[]; session: number | null } {
  if (typeof target === 'string') return { origins: [target], session: null };
  if (Array.isArray(target)) return { origins: target, session: null };

  return { origins: target.origins, session: target.session };
}

function postMessage(message: PlayerOutboundMessage, target: ParentTarget): void {
  const { origins, session } = resolveTarget(target);
  const payload = session === null ? message : { ...message, session };

  for (const origin of origins) {
    if (!origin) continue;

    if (window.opener && window.opener !== window) {
      window.opener.postMessage(payload, origin);
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, origin);
    }
  }
}

/**
 * Posts UI events to the exact parent origin. Never exposes run-time state.
 * Saves as soon as the package reports a module completed or passed, so the
 * embedder learns about completion without waiting for the next autosave.
 */
export function connectParentBridge(
  adapter: ScormAdapter,
  format: ScormFormat,
  parentOrigin: ParentTarget,
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

  adapter.on(initializeEventName(format), () => {
    postMessage({ type: 'initialized' }, parentOrigin);
  });

  let commitQueued = false;
  const triggerCommitOnCompletion = (value: unknown) => {
    if (typeof value !== 'string' || commitQueued) return;

    const normalized = value.trim().toLowerCase();
    if (normalized !== 'completed' && normalized !== 'passed') return;

    commitQueued = true;
    window.setTimeout(() => {
      commitQueued = false;
      commitRunningModule(adapter, format);
    }, 0);
  };

  if (format === 'scorm12') {
    adapter.on('LMSSetValue.cmi.core.lesson_status', (_element: string, value: unknown) => {
      triggerCommitOnCompletion(value);
    });
  } else {
    adapter.on('SetValue.cmi.completion_status', (_element: string, value: unknown) => {
      triggerCommitOnCompletion(value);
    });
    adapter.on('SetValue.cmi.success_status', (_element: string, value: unknown) => {
      triggerCommitOnCompletion(value);
    });
  }

  postMessage({ type: 'ready' }, parentOrigin);
}

/**
 * Commits a running module immediately, saving unsent state. No-ops before
 * initialization and once the module terminated.
 */
export function commitRunningModule(adapter: ScormAdapter, format: ScormFormat): void {
  if (!adapter.isInitialized() || adapter.isTerminated()) {
    return;
  }

  try {
    if (format === 'scorm12') {
      (adapter as Scorm12API).LMSCommit('');
    } else {
      (adapter as Scorm2004API).Commit('');
    }
  } catch {
    return;
  }
}

export function notifyCompleted(parentOrigin: ParentTarget): void {
  postMessage({ type: 'completed' }, parentOrigin);
}

/**
 * Reports a boot failure to an unknown embedder. The launch state (and with
 * it the parent origins) never arrived, so this broadcasts to any listener;
 * the dashboard only acts on it when the event origin matches the player it
 * launched. Carries no learner or package data.
 */
export function notifyBootError(error: string | null, session?: number): void {
  const message: PlayerOutboundMessage = { type: 'boot-error', error };
  const payload = session === undefined ? message : { ...message, session };

  try {
    if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*');
  } catch {
    return;
  }

  try {
    if (window.opener && window.opener !== window) window.opener.postMessage(payload, '*');
  } catch {
    return;
  }
}

export function notifyContentLoaded(parentOrigin: ParentTarget): void {
  postMessage({ type: 'content-loaded' }, parentOrigin);
}

export function notifyProgress(parentOrigin: ParentTarget): void {
  postMessage({ type: 'progress' }, parentOrigin);
}

/**
 * Asks the embedder to open another module. The embedder owns launches and
 * module locks, so it decides whether the request goes ahead.
 */
export function requestNavigation(
  parentOrigin: ParentTarget,
  action: PlayerNavAction,
  identifier: string | null
): void {
  postMessage({ type: 'nav', action, identifier }, parentOrigin);
}

/**
 * Asks the embedder to leave the fullscreen or full-window mode it put the
 * player in. The player leaves its own fullscreen itself.
 */
export function requestExitImmersive(parentOrigin: ParentTarget): void {
  postMessage({ type: 'exit-immersive' }, parentOrigin);
}

/**
 * Tells the embedder the player could not take fullscreen when asked, so the
 * embedder can fall back to full-window mode.
 */
export function notifyFullscreenUnavailable(parentOrigin: ParentTarget): void {
  postMessage({ type: 'fullscreen-unavailable' }, parentOrigin);
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
 * Reports packages that never call Initialize. Resolves true when
 * initialization is seen, and false on timeout or once `signal` aborts; an
 * aborted watch posts nothing.
 */
export function watchForConnection(
  adapter: ScormAdapter,
  format: ScormFormat,
  parentOrigin: ParentTarget,
  timeoutMs = DID_NOT_CONNECT_MS,
  signal?: AbortSignal
): Promise<boolean> {
  return new Promise((resolve) => {
    if (adapter.isInitialized()) {
      resolve(true);
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      if (signal?.aborted) return;

      settled = true;
      postMessage({ type: 'did-not-connect' }, parentOrigin);
      resolve(false);
    }, timeoutMs);

    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      resolve(false);
    });

    adapter.on(initializeEventName(format), () => {
      if (signal?.aborted) return;

      if (settled) {
        postMessage({ type: 'ready' }, parentOrigin);
      }

      window.clearTimeout(timer);
      resolve(true);
    });
  });
}

function defaultExitToSuspend(adapter: ScormAdapter, format: ScormFormat): void {
  try {
    if (format === 'scorm12') {
      const current = (adapter as Scorm12API).LMSGetValue('cmi.core.exit');
      if (!current || current === '') {
        (adapter as Scorm12API).LMSSetValue('cmi.core.exit', 'suspend');
      }
    } else {
      const current = (adapter as Scorm2004API).GetValue('cmi.exit');
      if (!current || current === '') {
        (adapter as Scorm2004API).SetValue('cmi.exit', 'suspend');
      }
    }
  } catch {
    return;
  }
}

/**
 * Finishes a module the package left running, which commits its unsent data.
 * No-ops before initialization and once the module terminated.
 */
export function finishRunningModule(adapter: ScormAdapter, format: ScormFormat): void {
  if (!adapter.isInitialized() || adapter.isTerminated()) {
    return;
  }

  defaultExitToSuspend(adapter, format);

  try {
    if (format === 'scorm12') {
      (adapter as Scorm12API).LMSFinish('');
    } else {
      (adapter as Scorm2004API).Terminate('');
    }
  } catch {
    return;
  }
}

/**
 * Saves unsent state when the page closes. A page kept for back navigation
 * stays alive, so it commits without terminating the package. Returns a
 * function that stops watching, for a module that ends while the page stays
 * open.
 */
export function flushOnPageHide(adapter: ScormAdapter, format: ScormFormat): () => void {
  const flush = (event?: PageTransitionEvent) => {
    if (event?.persisted) {
      commitRunningModule(adapter, format);
      return;
    }

    finishRunningModule(adapter, format);
  };

  window.addEventListener('pagehide', flush);

  return () => window.removeEventListener('pagehide', flush);
}
