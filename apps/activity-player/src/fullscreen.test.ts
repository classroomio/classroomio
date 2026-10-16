import { describe, expect, it, vi } from 'vitest';
import {
  canRequestFullscreen,
  enterFullscreen,
  exitFullscreen,
  fullscreenElementOf,
  nestsFullscreenNatively,
  onFullscreenChange
} from './fullscreen';

function asDocument(fields: Record<string, unknown>): Document {
  return fields as unknown as Document;
}

function asElement(fields: Record<string, unknown>): Element {
  return fields as unknown as Element;
}

describe('fullscreenElementOf', () => {
  it('reads the standard and the WebKit-prefixed element', () => {
    const element = asElement({});

    expect(fullscreenElementOf(asDocument({ fullscreenElement: element }))).toBe(element);
    expect(fullscreenElementOf(asDocument({ webkitFullscreenElement: element }))).toBe(element);
    expect(fullscreenElementOf(asDocument({}))).toBeNull();
  });
});

describe('canRequestFullscreen', () => {
  it('needs both an enabled document and a request method', () => {
    const standard = asElement({ requestFullscreen: () => Promise.resolve() });
    const prefixed = asElement({ webkitRequestFullscreen: () => undefined });

    expect(canRequestFullscreen(asDocument({ fullscreenEnabled: true }), standard)).toBe(true);
    expect(canRequestFullscreen(asDocument({ webkitFullscreenEnabled: true }), prefixed)).toBe(true);
    expect(canRequestFullscreen(asDocument({ fullscreenEnabled: false }), standard)).toBe(false);
    expect(canRequestFullscreen(asDocument({}), standard)).toBe(false);
    expect(canRequestFullscreen(asDocument({ fullscreenEnabled: true }), asElement({}))).toBe(false);
  });
});

describe('enterFullscreen and exitFullscreen', () => {
  it('prefers the standard methods', async () => {
    const requestFullscreen = vi.fn(() => Promise.resolve());
    const webkitRequestFullscreen = vi.fn();

    await enterFullscreen(asElement({ requestFullscreen, webkitRequestFullscreen }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(webkitRequestFullscreen).not.toHaveBeenCalled();
  });

  it('falls back to the WebKit methods', async () => {
    const webkitRequestFullscreen = vi.fn();
    const webkitExitFullscreen = vi.fn();

    await enterFullscreen(asElement({ webkitRequestFullscreen }));
    await exitFullscreen(asDocument({ webkitFullscreenElement: asElement({}), webkitExitFullscreen }));

    expect(webkitRequestFullscreen).toHaveBeenCalledOnce();
    expect(webkitExitFullscreen).toHaveBeenCalledOnce();
  });

  it('does not exit when nothing is fullscreen', async () => {
    const exit = vi.fn(() => Promise.resolve());

    await exitFullscreen(asDocument({ fullscreenElement: null, exitFullscreen: exit }));

    expect(exit).not.toHaveBeenCalled();
  });
});

describe('onFullscreenChange', () => {
  it('listens to both event names and stops on request', () => {
    const added: string[] = [];
    const removed: string[] = [];
    const doc = asDocument({
      addEventListener: (name: string) => added.push(name),
      removeEventListener: (name: string) => removed.push(name)
    });

    const stop = onFullscreenChange(doc, () => undefined);
    stop();

    expect(added).toEqual(['fullscreenchange', 'webkitfullscreenchange']);
    expect(removed).toEqual(['fullscreenchange', 'webkitfullscreenchange']);
  });
});

describe('nestsFullscreenNatively', () => {
  it('is true only for browsers exposing user agent client hints', () => {
    expect(nestsFullscreenNatively({ userAgentData: {} } as unknown as Navigator)).toBe(true);
    expect(nestsFullscreenNatively({} as Navigator)).toBe(false);
  });
});
