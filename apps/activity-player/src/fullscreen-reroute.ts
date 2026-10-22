import { fullscreenElementOf } from './fullscreen';

// Safari froze the whole tab when a package entered fullscreen right after the player left it; 400 ms and longer were safe.
export const REROUTE_SETTLE_MS = 500;

export interface RerouteOptions {
  shouldReroute: () => boolean;
  leaveFullscreen: () => Promise<void>;
  settleMs?: number;
}

type PatchableElementPrototype = {
  requestFullscreen?: (this: Element, options?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: (this: Element) => void;
};

type PatchableVideoPrototype = {
  webkitEnterFullscreen?: (this: HTMLVideoElement) => void;
};

type PackageWindow = Window & {
  Element?: { prototype: PatchableElementPrototype };
  HTMLVideoElement?: { prototype: PatchableVideoPrototype };
};

const VIDEO_EMBED_HOST_PATTERN =
  /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|wistia\.com|wistia\.net|vidyard\.com|loom\.com|dailymotion\.com|brightcove\.com|brightcove\.net|kaltura\.com|jwplayer\.com|jwplatform\.com)$/i;

const reroutedDocuments = new WeakSet<Document>();

function settle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a package's own fullscreen calls work while the player is fullscreen
 * in a browser that refuses nested fullscreen: when `shouldReroute` holds,
 * the player leaves fullscreen first, waits, then lets the call through
 * within the learner's original click. Patches each page once.
 */
export function installFullscreenReroute(packageWindow: Window, options: RerouteOptions): void {
  const page = packageWindow.document;
  if (reroutedDocuments.has(page)) return;

  reroutedDocuments.add(page);

  const target = packageWindow as PackageWindow;
  const settleMs = options.settleMs ?? REROUTE_SETTLE_MS;
  const afterLeaving = () => options.leaveFullscreen().then(() => settle(settleMs));
  const reroute = (action: () => void) => {
    void afterLeaving()
      .then(action)
      .catch((error) => {
        console.error('fullscreen reroute failed:', error);
      });
  };
  const elementPrototype = target.Element?.prototype;
  const videoPrototype = target.HTMLVideoElement?.prototype;

  const originalRequest = elementPrototype?.requestFullscreen;
  if (elementPrototype && originalRequest) {
    elementPrototype.requestFullscreen = function (this: Element, fullscreenOptions?: FullscreenOptions) {
      if (!options.shouldReroute()) return originalRequest.call(this, fullscreenOptions);

      return afterLeaving().then(() => originalRequest.call(this, fullscreenOptions));
    };
  }

  const originalWebkitRequest = elementPrototype?.webkitRequestFullscreen;
  if (elementPrototype && originalWebkitRequest) {
    elementPrototype.webkitRequestFullscreen = function (this: Element) {
      if (!options.shouldReroute()) return originalWebkitRequest.call(this);

      reroute(() => originalWebkitRequest.call(this));
    };
  }

  const originalEnterVideo = videoPrototype?.webkitEnterFullscreen;
  if (videoPrototype && originalEnterVideo) {
    videoPrototype.webkitEnterFullscreen = function (this: HTMLVideoElement) {
      if (!options.shouldReroute()) return originalEnterVideo.call(this);

      reroute(() => originalEnterVideo.call(this));
    };
  }
}

function sameOriginChildWindow(frame: HTMLIFrameElement): Window | null {
  try {
    const child = frame.contentWindow;

    return child && child.document ? child : null;
  } catch {
    return null;
  }
}

/**
 * Runs `visit` on the package window and on every same-origin frame inside
 * it, including frames added or navigated later. Cross-origin frames, such
 * as video embeds, are skipped because their pages cannot be reached.
 */
export function forEachSameOriginWindow(root: Window, visit: (win: Window) => void): void {
  const hookedFrames = new WeakSet<HTMLIFrameElement>();

  const walk = (win: Window) => {
    visit(win);

    const doc = win.document;
    const hookFrame = (frame: HTMLIFrameElement) => {
      if (hookedFrames.has(frame)) return;

      hookedFrames.add(frame);

      const enter = () => {
        const child = sameOriginChildWindow(frame);
        if (child) walk(child);
      };

      frame.addEventListener('load', enter);
      enter();
    };

    doc.querySelectorAll('iframe').forEach(hookFrame);

    const Observer = (win as Window & { MutationObserver?: typeof MutationObserver }).MutationObserver;
    if (!Observer || !doc.documentElement) return;

    new Observer((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof (win as Window & { Element: typeof Element }).Element)) return;
          if (node.tagName === 'IFRAME') hookFrame(node as HTMLIFrameElement);
          node.querySelectorAll('iframe').forEach(hookFrame);
        });
      }
    }).observe(doc.documentElement, { childList: true, subtree: true });
  };

  walk(root);
}

/**
 * True for an embed address on a known video host, which runs its own
 * fullscreen button out of the player's reach.
 */
export function isVideoEmbedUrl(src: string, baseUrl: string): boolean {
  try {
    const url = new URL(src, baseUrl);

    return (url.protocol === 'https:' || url.protocol === 'http:') && VIDEO_EMBED_HOST_PATTERN.test(url.hostname);
  } catch {
    return false;
  }
}

const MAX_FRAME_DEPTH = 5;

/**
 * True when the document, or a same-origin frame inside it, shows a video
 * whose fullscreen button cannot be rerouted: a native-controls video, which
 * the browser handles without any script, or an embed from a video host.
 */
export function hasUnreroutableVideo(doc: Document, depth = 0): boolean {
  if (doc.querySelector('video[controls]')) return true;

  const frames = Array.from(doc.querySelectorAll('iframe'));

  if (frames.some((frame) => isVideoEmbedUrl(frame.getAttribute('src') ?? '', doc.baseURI))) return true;
  if (depth >= MAX_FRAME_DEPTH) return false;

  return frames.some((frame) => {
    const child = sameOriginChildWindow(frame);

    return child ? hasUnreroutableVideo(child.document, depth + 1) : false;
  });
}

/**
 * True when a page in the package handed fullscreen to a frame the player
 * cannot read, such as a video embed. Chromium completes that hand-off only
 * up to the embed's frame, so the embed itself never enters fullscreen.
 */
export function fullscreenHandedToEmbed(doc: Document, depth = 0): boolean {
  const element = fullscreenElementOf(doc);
  if (!element || element.tagName !== 'IFRAME') return false;

  const child = sameOriginChildWindow(element as HTMLIFrameElement);
  if (!child) return true;

  return depth < MAX_FRAME_DEPTH && fullscreenHandedToEmbed(child.document, depth + 1);
}
