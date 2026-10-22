import { installLargeBeaconFetchFallback, replayPendingSaves } from './beacon-fallback';
import {
  notifyBootError,
  notifyFullscreenUnavailable,
  requestExitImmersive,
  requestNavigation,
  type ParentChannel,
  type PlayerNavAction
} from './bridge';
import {
  canRequestFullscreen,
  enterFullscreen,
  exitFullscreen,
  fullscreenElementOf,
  nestsFullscreenNatively,
  onFullscreenChange
} from './fullscreen';
import {
  forEachSameOriginWindow,
  fullscreenHandedToEmbed,
  hasUnreroutableVideo,
  installFullscreenReroute
} from './fullscreen-reroute';
import {
  DEFAULT_LABELS,
  parseDashboardMessage,
  type HostImmersiveMode,
  type PlayerUiLabels,
  type PlayerUiState
} from './inbound';
import { createNotice } from './notice';
import { readablePackageWindow } from './package-frame';
import { reportRuntimeEvent } from './runtime-event';
import { watchPageUnload } from './scorm/runtime-http';
import { startSession, type PlayerSession, type SessionHooks } from './session';
import { applyTheme, createToolbar } from './toolbar';

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

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) throw new Error(`Player markup is missing #${id}`);

  return element as T;
}

const HOST_EXIT_TIMEOUT_MS = 2000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

function replayStoredSaves(): Promise<void> {
  try {
    return replayPendingSaves(parseLaunchToken(window.location.pathname)).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

function boot(): void {
  installLargeBeaconFetchFallback();
  watchPageUnload();
  const pendingSavesFlushed = replayStoredSaves();

  const frame = requireElement<HTMLIFrameElement>('package-frame');
  const loading = requireElement<HTMLElement>('loading');
  const loadingText = requireElement<HTMLElement>('loading-text');
  const nestsNatively = nestsFullscreenNatively(navigator);
  const preparedDocuments = new WeakSet<Document>();

  let ui: PlayerUiState | null = null;
  let current: PlayerSession | null = null;
  let channel: ParentChannel | null = null;
  let hostMode: HostImmersiveMode = null;
  let hostExitWaiters: (() => void)[] = [];
  let videoHintShown = false;
  let activityFullscreen = false;
  let embedLeftActivityFullscreen = false;
  let showingRestoreNotice = false;
  let sessionQueue: Promise<void> = pendingSavesFlushed;

  const labels = (): PlayerUiLabels => ui?.labels ?? DEFAULT_LABELS;
  const isPlayerFullscreen = () => fullscreenElementOf(document) !== null;
  const isFullscreenLike = () => isPlayerFullscreen() || hostMode === 'fullscreen';
  const showLoading = () => {
    loading.hidden = false;
  };
  const hideLoading = () => {
    loading.hidden = true;
  };

  const navigate = (action: PlayerNavAction, identifier: string | null) => {
    if (channel) requestNavigation(channel, action, identifier);
  };

  const exitImmersive = () => {
    if (isPlayerFullscreen()) {
      void exitFullscreen(document).catch(() => undefined);
      return;
    }

    if (hostMode && channel) requestExitImmersive(channel);
  };

  const leaveHostFullscreen = () =>
    new Promise<void>((resolve) => {
      if (hostMode !== 'fullscreen' || !channel) {
        resolve();
        return;
      }

      hostExitWaiters.push(resolve);
      requestExitImmersive(channel);
      setTimeout(resolve, HOST_EXIT_TIMEOUT_MS);
    });

  const leaveFullscreenForPackage = () => (isPlayerFullscreen() ? exitFullscreen(document) : leaveHostFullscreen());

  const takeFullscreen = () => {
    const root = document.documentElement;

    if (!canRequestFullscreen(document, root)) {
      if (channel) notifyFullscreenUnavailable(channel);
      return;
    }

    void enterFullscreen(root).catch(() => {
      if (channel) notifyFullscreenUnavailable(channel);
    });
  };

  const toolbar = createToolbar(document, {
    previous: () => navigate('previous', null),
    next: () => navigate('next', null),
    select: (identifier) => navigate('select', identifier),
    exitImmersive
  });
  const notice = createNotice(document);

  const updateImmersive = () => toolbar.setImmersive(isPlayerFullscreen() || hostMode !== null);

  const maybeShowVideoHint = () => {
    if (nestsNatively || videoHintShown || !isFullscreenLike()) return;

    const packageWindow = readablePackageWindow(frame);
    if (!packageWindow || !hasUnreroutableVideo(packageWindow.document)) return;

    const copy = labels();
    videoHintShown = true;
    notice.show({
      message: copy.videoFullscreenHint,
      dismissLabel: copy.dismiss,
      action: { label: copy.exitFullscreen, run: exitImmersive }
    });
  };

  const showEmbedExitNotice = () => {
    const copy = labels();
    const hasKeyboard = window.matchMedia?.('(pointer: fine)').matches ?? false;

    notice.show({ message: hasKeyboard ? copy.escToExit : copy.backToExit });
  };

  const checkEmbedFullscreen = () => {
    if (!nestsNatively || !(activityFullscreen || hostMode === 'fullscreen')) return;

    const packageWindow = readablePackageWindow(frame);
    if (!packageWindow || !fullscreenHandedToEmbed(packageWindow.document)) return;

    embedLeftActivityFullscreen = true;
    showEmbedExitNotice();
  };
  const checkEmbedFullscreenSoon = () => setTimeout(checkEmbedFullscreen, 0);

  const showRestoreNotice = () => {
    const copy = labels();

    showingRestoreNotice = true;
    notice.show({
      message: copy.leftFullscreen,
      dismissLabel: copy.dismiss,
      action: { label: copy.returnToFullscreen, run: takeFullscreen }
    });
  };

  const handleFullscreenEnd = () => {
    if (embedLeftActivityFullscreen) {
      embedLeftActivityFullscreen = false;
      showRestoreNotice();
      return;
    }

    if (!showingRestoreNotice) notice.hide();
  };

  const handleFullscreenStart = () => {
    if (showingRestoreNotice) {
      showingRestoreNotice = false;
      notice.hide();
    }

    maybeShowVideoHint();
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || hostMode !== 'full-window' || !channel) return;

    requestExitImmersive(channel);
  };

  const preparePackageWindow = () => {
    const packageWindow = readablePackageWindow(frame);
    if (!packageWindow) return;

    if (!preparedDocuments.has(packageWindow.document)) {
      preparedDocuments.add(packageWindow.document);
      forEachSameOriginWindow(packageWindow, (win) => {
        installFullscreenReroute(win, {
          shouldReroute: () => !nestsNatively && isFullscreenLike(),
          leaveFullscreen: leaveFullscreenForPackage
        });
        toolbar.watchActivity(win.document);
        win.document.addEventListener('keydown', handleEscape);
        onFullscreenChange(win.document, checkEmbedFullscreenSoon);
      });
    }

    maybeShowVideoHint();
  };

  const reportBootFailure = (error: unknown, launchToken: string | null, session: number) => {
    const message = errorMessage(error);

    hideLoading();
    toolbar.setStatus(labels().loadFailed);
    notifyBootError(message, session);

    if (launchToken) void reportRuntimeEvent(launchToken, 'error', { message: message.slice(0, 500) });
  };

  const sessionHooks = (session: number): SessionHooks => ({
    frame,
    session,
    onContentVisible: hideLoading,
    onPackageParsed: preparePackageWindow,
    onStatus: (status) => toolbar.setStatus(status === 'not-connected' ? labels().didNotConnect : null)
  });

  const loadLaunch = (launchToken: string, session: number) => {
    sessionQueue = sessionQueue.then(async () => {
      const previous = current;
      current = null;

      toolbar.closeMenu();
      toolbar.setStatus(null);
      showingRestoreNotice = false;
      notice.hide();
      showLoading();

      if (previous) await previous.end();

      try {
        current = await startSession(launchToken, sessionHooks(session));
        channel = current.channel;
      } catch (error) {
        reportBootFailure(error, launchToken, session);
      }
    });
  };

  window.addEventListener('message', (event) => {
    if (!channel || !channel.origins.includes(event.origin)) return;
    if (event.source !== window.parent && event.source !== window.opener) return;

    const message = parseDashboardMessage(event.data);
    if (!message) return;

    if (message.type === 'player-ui') {
      ui = message.ui;
      applyTheme(document, ui.theme);
      toolbar.render(ui);
      loadingText.textContent = ui.labels.loading;
      return;
    }

    if (message.type === 'host-immersive') {
      hostMode = message.mode;
      updateImmersive();

      if (hostMode !== 'fullscreen') {
        const waiters = hostExitWaiters;
        hostExitWaiters = [];
        waiters.forEach((resolve) => resolve());
      }

      if (isFullscreenLike()) handleFullscreenStart();
      else handleFullscreenEnd();
      return;
    }

    if (message.type === 'request-fullscreen') {
      takeFullscreen();
      return;
    }

    loadLaunch(message.launchToken, message.session);
  });

  onFullscreenChange(document, () => {
    const element = fullscreenElementOf(document);
    if (element === document.documentElement) activityFullscreen = true;
    else if (!element) activityFullscreen = false;

    updateImmersive();

    if (isFullscreenLike()) handleFullscreenStart();
    else handleFullscreenEnd();

    checkEmbedFullscreenSoon();
  });
  document.addEventListener('keydown', handleEscape);
  frame.addEventListener('load', preparePackageWindow);

  let launchToken: string;

  try {
    launchToken = parseLaunchToken(window.location.pathname);
  } catch (error) {
    reportBootFailure(error, null, 0);
    return;
  }

  loadLaunch(launchToken, 0);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    boot();
  } catch (error) {
    notifyBootError(errorMessage(error), 0);
  }
}
