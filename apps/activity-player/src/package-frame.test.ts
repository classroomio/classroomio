import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isPackageDocumentParsed,
  onPackageDocumentParsed,
  readablePackageWindow,
  unloadPackageFrame
} from './package-frame';

interface FakeFrame {
  contentDocument: { URL: string; readyState: string } | null;
  listeners: Map<string, () => void>;
  addEventListener: (type: string, callback: () => void) => void;
  removeEventListener: (type: string) => void;
}

function fakeFrame(contentDocument: FakeFrame['contentDocument']): FakeFrame {
  const listeners = new Map<string, () => void>();

  return {
    contentDocument,
    listeners,
    addEventListener: (type, callback) => listeners.set(type, callback),
    removeEventListener: (type) => listeners.delete(type)
  };
}

function asFrame(frame: FakeFrame | object): HTMLIFrameElement {
  return frame as unknown as HTMLIFrameElement;
}

describe('isPackageDocumentParsed', () => {
  it('is false for the initial blank document', () => {
    expect(isPackageDocumentParsed(asFrame(fakeFrame({ URL: 'about:blank', readyState: 'complete' })))).toBe(false);
  });

  it('is false while the package document is still parsing', () => {
    const frame = fakeFrame({ URL: 'https://content.test/index.html', readyState: 'loading' });

    expect(isPackageDocumentParsed(asFrame(frame))).toBe(false);
  });

  it('is true once the package document is interactive', () => {
    const frame = fakeFrame({ URL: 'https://content.test/index.html', readyState: 'interactive' });

    expect(isPackageDocumentParsed(asFrame(frame))).toBe(true);
  });

  it('is false when the document cannot be read', () => {
    const frame = Object.defineProperty({}, 'contentDocument', {
      get: () => {
        throw new Error('blocked');
      }
    });

    expect(isPackageDocumentParsed(asFrame(frame))).toBe(false);
  });
});

describe('onPackageDocumentParsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setInterval, clearInterval, setTimeout, clearTimeout });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('fires once when the document parses, before load', () => {
    const frame = fakeFrame({ URL: 'about:blank', readyState: 'complete' });
    const onParsed = vi.fn();
    onPackageDocumentParsed(asFrame(frame), onParsed);

    vi.advanceTimersByTime(300);
    expect(onParsed).not.toHaveBeenCalled();

    frame.contentDocument = { URL: 'https://content.test/index.html', readyState: 'interactive' };
    vi.advanceTimersByTime(300);

    expect(onParsed).toHaveBeenCalledTimes(1);
    expect(frame.listeners.has('load')).toBe(false);
  });

  it('falls back to the load event', () => {
    const frame = fakeFrame(null);
    const onParsed = vi.fn();
    onPackageDocumentParsed(asFrame(frame), onParsed);

    frame.listeners.get('load')?.();
    vi.advanceTimersByTime(300);

    expect(onParsed).toHaveBeenCalledTimes(1);
  });

  it('stops waiting when asked', () => {
    const frame = fakeFrame({ URL: 'about:blank', readyState: 'complete' });
    const onParsed = vi.fn();
    const stop = onPackageDocumentParsed(asFrame(frame), onParsed);

    stop();
    frame.contentDocument = { URL: 'https://content.test/index.html', readyState: 'interactive' };
    vi.advanceTimersByTime(300);

    expect(onParsed).not.toHaveBeenCalled();
    expect(frame.listeners.has('load')).toBe(false);
  });
});

describe('unloadPackageFrame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setInterval, clearInterval, setTimeout, clearTimeout });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function srcFrame(src: string | null) {
    const attributes = new Map<string, string>();
    if (src) attributes.set('src', src);
    const listeners = new Map<string, () => void>();

    return {
      attributes,
      listeners,
      getAttribute: (name: string) => attributes.get(name) ?? null,
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      addEventListener: (type: string, callback: () => void) => listeners.set(type, callback),
      removeEventListener: (type: string) => listeners.delete(type)
    };
  }

  it('navigates to a blank page and resolves on its load', async () => {
    const frame = srcFrame('/activity/content/token/index.html');
    const done = vi.fn();

    void unloadPackageFrame(frame as unknown as HTMLIFrameElement).then(done);
    expect(frame.attributes.get('src')).toBe('about:blank');

    frame.listeners.get('load')?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(done).toHaveBeenCalledOnce();
  });

  it('gives up waiting after the timeout', async () => {
    const frame = srcFrame('/activity/content/token/index.html');
    const done = vi.fn();

    void unloadPackageFrame(frame as unknown as HTMLIFrameElement, 100).then(done);
    await vi.advanceTimersByTimeAsync(100);

    expect(done).toHaveBeenCalledOnce();
  });

  it('resolves at once for a frame that shows nothing', async () => {
    await expect(unloadPackageFrame(srcFrame(null) as unknown as HTMLIFrameElement)).resolves.toBeUndefined();
  });
});

describe('readablePackageWindow', () => {
  it('returns same-origin package windows only', () => {
    const packageWindow = { location: { href: 'https://content.test/index.html' }, document: {} };
    const blankWindow = { location: { href: 'about:blank' }, document: {} };
    const crossOrigin = {
      get location(): Location {
        throw new Error('cross-origin');
      }
    };

    expect(readablePackageWindow(asFrame({ contentWindow: packageWindow }))).toBe(packageWindow);
    expect(readablePackageWindow(asFrame({ contentWindow: blankWindow }))).toBeNull();
    expect(readablePackageWindow(asFrame({ contentWindow: crossOrigin }))).toBeNull();
    expect(readablePackageWindow(asFrame({ contentWindow: null }))).toBeNull();
  });
});
