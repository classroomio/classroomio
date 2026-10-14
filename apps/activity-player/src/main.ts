import {
  buildAdapterSettings,
  createScormAdapter,
  exposeAdapter,
  initializeCommitSequence,
  initializeEventName,
  type LaunchState
} from './scorm/adapter';
import type { Scorm12API } from 'scorm-again/scorm12';
import type { Scorm2004API } from 'scorm-again/scorm2004';
import { connectParentBridge, flushOnPageHide, notifyCompleted, watchForConnection } from './bridge';
import { reportRuntimeEvent } from './runtime-event';

/**
 * Extracts the launch token from a player pathname. Throws when absent.
 */
export function parseLaunchToken(pathname: string): string {
  const match = pathname.match(/\/activity\/player\/([^/]+)/);

  if (!match) {
    throw new Error(`Player opened without a launch token: ${pathname}`);
  }

  return decodeURIComponent(match[1]);
}

function readLaunchToken(): string {
  return parseLaunchToken(window.location.pathname);
}

async function fetchLaunchState(launchToken: string): Promise<LaunchState> {
  const response = await fetch(`/activity/scorm/runtime/${encodeURIComponent(launchToken)}/state`);

  if (!response.ok) {
    throw new Error(`Launch state request failed: ${response.status}`);
  }

  return (await response.json()) as LaunchState;
}

function setStatus(text: string): void {
  const status = document.getElementById('status');

  if (status) {
    status.textContent = text;
  }
}

function mountPackageFrame(contentToken: string, launchPath: string): void {
  const frame = document.getElementById('package-frame');

  if (!(frame instanceof HTMLIFrameElement)) {
    throw new Error('Package frame is missing');
  }

  frame.src = `/activity/content/${encodeURIComponent(contentToken)}/${launchPath}`;
}

async function boot(): Promise<void> {
  const launchToken = readLaunchToken();
  const state = await fetchLaunchState(launchToken);
  const parentOrigins =
    state.parentOrigins && state.parentOrigins.length > 0 ? state.parentOrigins : state.parentOrigin;
  const adapter = createScormAdapter(
    state.format,
    buildAdapterSettings(launchToken, state.debug, () => notifyCompleted(parentOrigins))
  );

  initializeCommitSequence(adapter, state.commitSeq ?? 0);
  adapter.loadFromJSON(state.cmi ?? {});
  if (state.mode === 'review') {
    if (state.format === 'scorm12') {
      (adapter as Scorm12API).cmi.core.lesson_mode = 'review';
    } else {
      (adapter as Scorm2004API).cmi.mode = 'review';
    }
  }
  if (state.entry) {
    if (state.format === 'scorm12') {
      (adapter as Scorm12API).cmi.core.entry = state.entry;
    } else {
      (adapter as Scorm2004API).cmi.entry = state.entry;
    }
  }
  exposeAdapter(state.format, adapter);
  connectParentBridge(adapter, state.format, parentOrigins);
  flushOnPageHide(adapter, state.format);
  adapter.on(initializeEventName(state.format), () => {
    void reportRuntimeEvent(launchToken, 'initialize');
  });
  mountPackageFrame(state.contentToken, state.launchPath);
  setStatus(
    state.mode === 'review' ? 'Review mode. Nothing here is recorded.' : 'Running. Progress saves automatically.'
  );
  const connected = await watchForConnection(adapter, state.format, parentOrigins);

  if (!connected) {
    setStatus('This package did not connect. Reload to try again.');
    void reportRuntimeEvent(launchToken, 'not_initialized');
    adapter.on(initializeEventName(state.format), () => {
      setStatus(
        state.mode === 'review' ? 'Review mode. Nothing here is recorded.' : 'Running. Progress saves automatically.'
      );
    });
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  boot().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'unknown error';
    setStatus(`This package did not connect: ${message}`);

    try {
      const launchToken = parseLaunchToken(window.location.pathname);
      void reportRuntimeEvent(launchToken, 'error', { message: message.slice(0, 500) });
    } catch {
      return;
    }
  });
}
