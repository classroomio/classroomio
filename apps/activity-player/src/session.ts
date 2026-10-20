import type { Scorm12API } from 'scorm-again/scorm12';
import type { Scorm2004API } from 'scorm-again/scorm2004';

import {
  DID_NOT_CONNECT_MS,
  connectParentBridge,
  finishRunningModule,
  flushOnPageHide,
  notifyCompleted,
  notifyContentLoaded,
  notifyProgress,
  watchForConnection,
  type ParentChannel
} from './bridge';
import { onPackageDocumentParsed, unloadPackageFrame } from './package-frame';
import { reportRuntimeEvent } from './runtime-event';
import {
  buildAdapterSettings,
  createScormAdapter,
  exposeAdapter,
  initializeCommitSequence,
  initializeEventName,
  unexposeAdapter,
  type LaunchState,
  type ScormAdapter
} from './scorm/adapter';

export type SessionStatus = 'running' | 'not-connected';

export interface SessionHooks {
  frame: HTMLIFrameElement;
  session: number;
  onContentVisible: () => void;
  onPackageParsed: () => void;
  onStatus: (status: SessionStatus) => void;
}

export interface PlayerSession {
  readonly launchToken: string;
  readonly channel: ParentChannel;
  end: () => Promise<void>;
}

export async function fetchLaunchState(launchToken: string): Promise<LaunchState> {
  const response = await fetch(`/activity/scorm/runtime/${encodeURIComponent(launchToken)}/state`);

  if (!response.ok) {
    throw new Error(`Launch state request failed: ${response.status}`);
  }

  return (await response.json()) as LaunchState;
}

export function parentOriginsOf(state: LaunchState): string[] {
  return state.parentOrigins && state.parentOrigins.length > 0 ? state.parentOrigins : [state.parentOrigin];
}

function applyLaunchMode(adapter: ScormAdapter, state: LaunchState): void {
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
}

function mountPackageFrame(frame: HTMLIFrameElement, contentToken: string, launchPath: string): void {
  frame.setAttribute('src', `/activity/content/${encodeURIComponent(contentToken)}/${launchPath}`);
}

/**
 * Starts one module: fetches its launch state, exposes its run-time API and
 * frames the package. Throws when the launch state cannot be loaded. The
 * returned session's `end` unloads the package, saves a module the package
 * left running and removes the API, so the next module can start in the
 * same player page.
 */
export async function startSession(launchToken: string, hooks: SessionHooks): Promise<PlayerSession> {
  const state = await fetchLaunchState(launchToken);
  const channel: ParentChannel = { origins: parentOriginsOf(state), session: hooks.session };
  const connection = new AbortController();
  let active = true;

  const adapter = createScormAdapter(
    state.format,
    buildAdapterSettings(
      launchToken,
      state.debug,
      () => notifyCompleted(channel),
      () => notifyProgress(channel),
      state.cmi
    )
  );

  initializeCommitSequence(adapter, state.commitSeq ?? 0);
  adapter.loadFromJSON(state.cmi ?? {});
  applyLaunchMode(adapter, state);
  exposeAdapter(state.format, adapter);

  let stopPageHideFlush: () => void = () => {};
  let stopParsedWatch: () => void = () => {};

  try {
    connectParentBridge(adapter, state.format, channel);
    stopPageHideFlush = flushOnPageHide(adapter, state.format);

    adapter.on(initializeEventName(state.format), () => {
      if (!active) return;

      hooks.onContentVisible();
      void reportRuntimeEvent(launchToken, 'initialize');
    });

    mountPackageFrame(hooks.frame, state.contentToken, state.launchPath);
    stopParsedWatch = onPackageDocumentParsed(hooks.frame, () => {
      if (!active) return;

      hooks.onPackageParsed();
      hooks.onContentVisible();
      notifyContentLoaded(channel);
    });
  } catch (error) {
    active = false;
    stopParsedWatch();
    stopPageHideFlush();
    unexposeAdapter(state.format);
    throw error;
  }

  hooks.onStatus('running');

  void watchForConnection(adapter, state.format, channel, DID_NOT_CONNECT_MS, connection.signal).then((connected) => {
    if (connected || connection.signal.aborted || !active) return;

    hooks.onContentVisible();
    hooks.onStatus('not-connected');
    void reportRuntimeEvent(launchToken, 'not_initialized');
    adapter.on(initializeEventName(state.format), () => {
      if (active) hooks.onStatus('running');
    });
  });

  return {
    launchToken,
    channel,
    async end() {
      if (!active) return;

      connection.abort();
      stopParsedWatch();
      await unloadPackageFrame(hooks.frame);
      finishRunningModule(adapter, state.format);
      stopPageHideFlush();
      unexposeAdapter(state.format);
      active = false;
    }
  };
}
