const PARSED_POLL_MS = 100;
const UNLOAD_TIMEOUT_MS = 3000;
const BLANK_URL = 'about:blank';

/**
 * True once the framed package document has finished parsing. False while the
 * frame still holds its initial blank document or the document is unreadable.
 */
export function isPackageDocumentParsed(frame: HTMLIFrameElement): boolean {
  try {
    const packageDocument = frame.contentDocument;

    if (!packageDocument || packageDocument.URL === BLANK_URL) return false;

    return packageDocument.readyState !== 'loading';
  } catch {
    return false;
  }
}

/**
 * Calls onParsed once, when the package document has parsed or, failing that,
 * when the frame fires load. Subresources such as external images, fonts and
 * embeds may still be loading. Returns a function that stops waiting.
 */
export function onPackageDocumentParsed(frame: HTMLIFrameElement, onParsed: () => void): () => void {
  let settled = false;

  const stop = () => {
    settled = true;
    window.clearInterval(pollTimer);
    frame.removeEventListener('load', settle);
  };

  const settle = () => {
    if (settled) return;

    stop();
    onParsed();
  };

  const pollTimer = window.setInterval(() => {
    if (isPackageDocumentParsed(frame)) settle();
  }, PARSED_POLL_MS);

  frame.addEventListener('load', settle);

  return stop;
}

/**
 * Navigates the frame to a blank page so the package runs its own unload
 * handlers, which often save and finish the module. Resolves once the blank
 * page loads, or after a timeout for packages that block unloading.
 */
export function unloadPackageFrame(frame: HTMLIFrameElement, timeoutMs = UNLOAD_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve) => {
    if (!frame.getAttribute('src') || frame.getAttribute('src') === BLANK_URL) {
      resolve();
      return;
    }

    const done = () => {
      window.clearTimeout(timer);
      frame.removeEventListener('load', done);
      resolve();
    };
    const timer = window.setTimeout(done, timeoutMs);

    frame.addEventListener('load', done);
    frame.setAttribute('src', BLANK_URL);
  });
}

/**
 * Returns the frame's window when it is a same-origin page other than the
 * blank placeholder, and null otherwise.
 */
export function readablePackageWindow(frame: HTMLIFrameElement): Window | null {
  try {
    const packageWindow = frame.contentWindow;

    if (!packageWindow || packageWindow.location.href === BLANK_URL) return null;

    return packageWindow.document ? packageWindow : null;
  } catch {
    return null;
  }
}
