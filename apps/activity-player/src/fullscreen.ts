type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => void;
};

type FullscreenElement = Element & {
  webkitRequestFullscreen?: () => void;
};

const CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

export function fullscreenElementOf(doc: Document): Element | null {
  const fullscreenDocument = doc as FullscreenDocument;

  return fullscreenDocument.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null;
}

/**
 * True when this document may put `element` in fullscreen. False on iPhone,
 * which has no element fullscreen, and in frames not allowed to.
 */
export function canRequestFullscreen(doc: Document, element: Element): boolean {
  const fullscreenDocument = doc as FullscreenDocument;
  const enabled = fullscreenDocument.fullscreenEnabled ?? fullscreenDocument.webkitFullscreenEnabled ?? false;
  const target = element as FullscreenElement;

  return (
    enabled && (typeof target.requestFullscreen === 'function' || typeof target.webkitRequestFullscreen === 'function')
  );
}

export function enterFullscreen(element: Element): Promise<void> {
  const target = element as FullscreenElement;

  if (typeof target.requestFullscreen === 'function') return target.requestFullscreen();

  target.webkitRequestFullscreen?.();

  return Promise.resolve();
}

export function exitFullscreen(doc: Document): Promise<void> {
  const fullscreenDocument = doc as FullscreenDocument;

  if (!fullscreenElementOf(doc)) return Promise.resolve();
  if (typeof fullscreenDocument.exitFullscreen === 'function') return fullscreenDocument.exitFullscreen();

  fullscreenDocument.webkitExitFullscreen?.();

  return Promise.resolve();
}

/**
 * Calls listener on every fullscreen change of the document. Returns a function that stops listening.
 */
export function onFullscreenChange(doc: Document, listener: () => void): () => void {
  for (const name of CHANGE_EVENTS) doc.addEventListener(name, listener);

  return () => {
    for (const name of CHANGE_EVENTS) doc.removeEventListener(name, listener);
  };
}

/**
 * True for Chromium browsers, which let a framed package take fullscreen
 * inside the player's fullscreen. Safari refuses, and Firefox is untested,
 * so both take the reroute path instead.
 */
export function nestsFullscreenNatively(navigatorLike: Navigator): boolean {
  return 'userAgentData' in navigatorLike;
}
