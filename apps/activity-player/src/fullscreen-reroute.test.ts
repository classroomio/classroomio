import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  REROUTE_SETTLE_MS,
  forEachSameOriginWindow,
  hasUnreroutableVideo,
  installFullscreenReroute,
  isVideoEmbedUrl
} from './fullscreen-reroute';

function fakePackageWindow() {
  const requestFullscreen = vi.fn((_options?: FullscreenOptions) => Promise.resolve());
  const webkitRequestFullscreen = vi.fn();
  const webkitEnterFullscreen = vi.fn();
  const win = {
    document: {},
    Element: { prototype: { requestFullscreen, webkitRequestFullscreen } },
    HTMLVideoElement: { prototype: { webkitEnterFullscreen } }
  };

  return {
    win: win as unknown as Window,
    prototypes: win,
    requestFullscreen,
    webkitRequestFullscreen,
    webkitEnterFullscreen
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('installFullscreenReroute', () => {
  it('passes requests straight through while rerouting is off', async () => {
    const { win, prototypes, requestFullscreen } = fakePackageWindow();
    const leaveFullscreen = vi.fn(() => Promise.resolve());
    installFullscreenReroute(win, { shouldReroute: () => false, leaveFullscreen });
    const element = { id: 'video' };

    await prototypes.Element.prototype.requestFullscreen.call(element);

    expect(leaveFullscreen).not.toHaveBeenCalled();
    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen.mock.instances[0]).toBe(element);
  });

  it('leaves the player fullscreen, waits, then requests for the same element', async () => {
    const { win, prototypes, requestFullscreen } = fakePackageWindow();
    const leaveFullscreen = vi.fn(() => Promise.resolve());
    installFullscreenReroute(win, { shouldReroute: () => true, leaveFullscreen });
    const element = { id: 'video' };

    const pending = prototypes.Element.prototype.requestFullscreen.call(element, { navigationUI: 'hide' });
    await vi.advanceTimersByTimeAsync(REROUTE_SETTLE_MS - 1);

    expect(leaveFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await pending;

    expect(requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' });
    expect(requestFullscreen.mock.instances[0]).toBe(element);
  });

  it('reroutes the WebKit element and video methods too', async () => {
    const { win, prototypes, webkitRequestFullscreen, webkitEnterFullscreen } = fakePackageWindow();
    installFullscreenReroute(win, {
      shouldReroute: () => true,
      leaveFullscreen: () => Promise.resolve(),
      settleMs: 10
    });

    prototypes.Element.prototype.webkitRequestFullscreen.call({});
    prototypes.HTMLVideoElement.prototype.webkitEnterFullscreen.call({});
    await vi.advanceTimersByTimeAsync(10);

    expect(webkitRequestFullscreen).toHaveBeenCalledOnce();
    expect(webkitEnterFullscreen).toHaveBeenCalledOnce();
  });

  it('patches each page only once', async () => {
    const { win, prototypes } = fakePackageWindow();
    const leaveFullscreen = vi.fn(() => Promise.resolve());
    installFullscreenReroute(win, { shouldReroute: () => true, leaveFullscreen, settleMs: 0 });
    installFullscreenReroute(win, { shouldReroute: () => true, leaveFullscreen, settleMs: 0 });

    const pending = prototypes.Element.prototype.requestFullscreen.call({});
    await vi.advanceTimersByTimeAsync(0);
    await pending;

    expect(leaveFullscreen).toHaveBeenCalledOnce();
  });
});

describe('isVideoEmbedUrl', () => {
  it('recognises video hosts and their subdomains', () => {
    expect(isVideoEmbedUrl('https://www.youtube.com/embed/abc', 'https://content.test/')).toBe(true);
    expect(isVideoEmbedUrl('//player.vimeo.com/video/1', 'https://content.test/')).toBe(true);
    expect(isVideoEmbedUrl('https://fast.wistia.net/embed/iframe/x', 'https://content.test/')).toBe(true);
  });

  it('ignores package pages and look-alike hosts', () => {
    expect(isVideoEmbedUrl('slides/web-object.html', 'https://content.test/')).toBe(false);
    expect(isVideoEmbedUrl('https://notyoutube.com/embed/abc', 'https://content.test/')).toBe(false);
    expect(isVideoEmbedUrl('javascript:alert(1)', 'https://content.test/')).toBe(false);
  });
});

function fakeDocument(options: {
  nativeVideo?: boolean;
  frames?: { src: string; child?: Document; crossOrigin?: boolean }[];
}) {
  const frames = (options.frames ?? []).map((frame) => ({
    getAttribute: () => frame.src,
    get contentWindow() {
      if (frame.crossOrigin) {
        return {
          get document(): Document {
            throw new Error('cross-origin');
          }
        };
      }

      return frame.child ? { document: frame.child } : null;
    }
  }));

  return {
    baseURI: 'https://content.test/sco/index.html',
    querySelector: (selector: string) => (selector === 'video[controls]' && options.nativeVideo ? {} : null),
    querySelectorAll: () => frames
  } as unknown as Document;
}

describe('hasUnreroutableVideo', () => {
  it('finds native-controls videos and video embeds', () => {
    expect(hasUnreroutableVideo(fakeDocument({ nativeVideo: true }))).toBe(true);
    expect(hasUnreroutableVideo(fakeDocument({ frames: [{ src: 'https://www.youtube-nocookie.com/embed/x' }] }))).toBe(
      true
    );
  });

  it('looks inside same-origin frames but not cross-origin ones', () => {
    const nested = fakeDocument({ nativeVideo: true });

    expect(hasUnreroutableVideo(fakeDocument({ frames: [{ src: 'web-object.html', child: nested }] }))).toBe(true);
    expect(hasUnreroutableVideo(fakeDocument({ frames: [{ src: 'https://other.test/', crossOrigin: true }] }))).toBe(
      false
    );
  });

  it('is false for packages without videos', () => {
    expect(hasUnreroutableVideo(fakeDocument({}))).toBe(false);
  });
});

describe('forEachSameOriginWindow', () => {
  it('visits the package window and its same-origin frames', () => {
    const childWindow = { document: { querySelectorAll: () => [], documentElement: null } } as unknown as Window;
    const frame = {
      addEventListener: vi.fn(),
      get contentWindow() {
        return childWindow;
      }
    };
    const root = {
      document: { querySelectorAll: () => [frame], documentElement: null }
    } as unknown as Window;
    const visited: Window[] = [];

    forEachSameOriginWindow(root, (win) => visited.push(win));

    expect(visited).toEqual([root, childWindow]);
    expect(frame.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });
});

describe('installFullscreenReroute across navigations', () => {
  it('patches the next page loaded into the same frame window', async () => {
    const first = fakePackageWindow();
    const leaveFullscreen = vi.fn(() => Promise.resolve());
    installFullscreenReroute(first.win, { shouldReroute: () => true, leaveFullscreen, settleMs: 0 });

    const navigated = fakePackageWindow();
    const sameWindow = first.win as unknown as Record<string, unknown>;
    sameWindow['document'] = (navigated.win as unknown as Record<string, unknown>)['document'];
    sameWindow['Element'] = navigated.prototypes.Element;
    installFullscreenReroute(first.win, { shouldReroute: () => true, leaveFullscreen, settleMs: 0 });

    const pending = navigated.prototypes.Element.prototype.requestFullscreen.call({});
    await vi.advanceTimersByTimeAsync(0);
    await pending;

    expect(leaveFullscreen).toHaveBeenCalledOnce();
    expect(navigated.requestFullscreen).toHaveBeenCalledOnce();
  });
});
