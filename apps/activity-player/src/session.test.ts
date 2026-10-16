import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scorm12API } from 'scorm-again/scorm12';
import { startSession, type SessionHooks } from './session';

type Listener = () => void;

interface FakeFrame {
  attributes: Map<string, string>;
  listeners: Map<string, Set<Listener>>;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  addEventListener: (type: string, listener: Listener) => void;
  removeEventListener: (type: string, listener: Listener) => void;
  contentDocument: { URL: string; readyState: string } | null;
}

function fakeFrame(): FakeFrame {
  const frame: FakeFrame = {
    attributes: new Map(),
    listeners: new Map(),
    setAttribute(name, value) {
      frame.attributes.set(name, value);

      if (name === 'src') {
        frame.contentDocument = {
          URL: value === 'about:blank' ? 'about:blank' : `https://content.test${value}`,
          readyState: 'complete'
        };
        setTimeout(() => frame.listeners.get('load')?.forEach((listener) => listener()), 0);
      }
    },
    getAttribute: (name) => frame.attributes.get(name) ?? null,
    addEventListener(type, listener) {
      const existing = frame.listeners.get(type) ?? new Set();
      existing.add(listener);
      frame.listeners.set(type, existing);
    },
    removeEventListener(type, listener) {
      frame.listeners.get(type)?.delete(listener);
    },
    contentDocument: null
  };

  return frame;
}

interface CommitRecord {
  url: string;
  body: unknown;
}

async function bodyText(body: unknown): Promise<string> {
  if (typeof body === 'string') return body;
  if (body instanceof Blob) return body.text();

  return String(body);
}

const commits: CommitRecord[] = [];

class FakeXMLHttpRequest {
  status = 200;
  responseText = '{"result":true,"errorCode":0}';
  private url = '';
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader() {}
  send(body: string) {
    commits.push({ url: this.url, body });
  }
}

function launchState(format: 'scorm12' | 'scorm2004') {
  return {
    format,
    cmi: {},
    contentToken: 'content-token',
    launchPath: 'sco/index.html',
    parentOrigin: 'https://app.test',
    parentOrigins: ['https://app.test'],
    entry: 'ab-initio',
    commitSeq: 0,
    mode: 'normal',
    debug: false
  };
}

let parentPostMessage: ReturnType<typeof vi.fn>;
let windowListeners: Map<string, Set<Listener>>;

function installWindow() {
  parentPostMessage = vi.fn();
  windowListeners = new Map();
  const fakeWindow: Record<string, unknown> = {
    parent: { postMessage: parentPostMessage },
    opener: null,
    setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    setInterval: (callback: () => void, ms: number) => setInterval(callback, ms),
    clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
    addEventListener: (type: string, listener: Listener) => {
      const existing = windowListeners.get(type) ?? new Set();
      existing.add(listener);
      windowListeners.set(type, existing);
    },
    removeEventListener: (type: string, listener: Listener) => windowListeners.get(type)?.delete(listener)
  };
  vi.stubGlobal('window', fakeWindow);

  return fakeWindow;
}

function hooksFor(frame: FakeFrame, session: number): SessionHooks {
  return {
    frame: frame as unknown as HTMLIFrameElement,
    session,
    onContentVisible: vi.fn(),
    onPackageParsed: vi.fn(),
    onStatus: vi.fn()
  };
}

function posted() {
  return parentPostMessage.mock.calls.map((call) => call[0] as Record<string, unknown>);
}

beforeEach(() => {
  commits.length = 0;
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  vi.stubGlobal('navigator', {
    sendBeacon: (url: string, body?: unknown) => {
      commits.push({ url, body });
      return true;
    }
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/state')) {
        const format = url.includes('2004') ? 'scorm2004' : 'scorm12';
        return { ok: true, status: 200, json: async () => launchState(format) };
      }

      return { ok: true, status: 200, json: async () => ({}) };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('startSession', () => {
  it('exposes the API, frames the package and tags messages with the session', async () => {
    const fakeWindow = installWindow();
    const frame = fakeFrame();

    const session = await startSession('token-12', hooksFor(frame, 2));

    expect(fakeWindow['API']).toBeDefined();
    expect(frame.getAttribute('src')).toBe('/activity/content/content-token/sco/index.html');
    expect(session.channel).toEqual({ origins: ['https://app.test'], session: 2 });
    expect(posted()).toEqual([{ type: 'ready', session: 2 }]);

    await session.end();
  });

  it('fails without exposing an API when the launch state cannot load', async () => {
    const fakeWindow = installWindow();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    await expect(startSession('expired', hooksFor(fakeFrame(), 0))).rejects.toThrow('401');
    expect(fakeWindow['API']).toBeUndefined();
  });
});

describe('ending a session', () => {
  it('unloads the package, saves the running module and removes its API', async () => {
    const fakeWindow = installWindow();
    const frame = fakeFrame();
    const session = await startSession('token-12', hooksFor(frame, 1));
    const api = fakeWindow['API'] as Scorm12API;
    api.LMSInitialize('');
    api.LMSSetValue('cmi.core.lesson_location', 'page-3');

    await session.end();

    expect(frame.getAttribute('src')).toBe('about:blank');
    expect(commits).toHaveLength(1);
    expect(commits[0]?.url).toBe('/activity/scorm/runtime/token-12/commit');
    expect(await bodyText(commits[0]?.body)).toContain('page-3');
    expect(fakeWindow['API']).toBeUndefined();
    expect(posted()).toContainEqual({ type: 'terminated', navRequest: null, session: 1 });
    expect(windowListeners.get('pagehide')?.size ?? 0).toBe(0);
  });

  it('only unloads a module that never initialized', async () => {
    const fakeWindow = installWindow();
    const frame = fakeFrame();
    const session = await startSession('token-12', hooksFor(frame, 0));

    await session.end();

    expect(commits).toHaveLength(0);
    expect(fakeWindow['API']).toBeUndefined();
  });

  it('lets the next module expose its own API in the same page', async () => {
    const fakeWindow = installWindow();
    const frame = fakeFrame();
    const first = await startSession('token-12', hooksFor(frame, 0));
    const firstApi = fakeWindow['API'];

    await first.end();
    const second = await startSession('token-12-next', hooksFor(frame, 1));

    expect(fakeWindow['API']).toBeDefined();
    expect(fakeWindow['API']).not.toBe(firstApi);
    expect(posted().at(-1)).toEqual({ type: 'ready', session: 1 });

    await second.end();
  });

  it('switches between formats without leaving the old API behind', async () => {
    const fakeWindow = installWindow();
    const frame = fakeFrame();
    const first = await startSession('token-12', hooksFor(frame, 0));

    await first.end();
    const second = await startSession('token-2004', hooksFor(frame, 1));

    expect(fakeWindow['API']).toBeUndefined();
    expect(fakeWindow['API_1484_11']).toBeDefined();

    await second.end();
    expect(fakeWindow['API_1484_11']).toBeUndefined();
  });

  it('ignores the old module once it ended', async () => {
    installWindow();
    const frame = fakeFrame();
    const hooks = hooksFor(frame, 0);
    const session = await startSession('token-12', hooks);
    await new Promise((resolve) => setTimeout(resolve, 150));
    vi.mocked(hooks.onPackageParsed).mockClear();

    await session.end();
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(hooks.onPackageParsed).not.toHaveBeenCalled();
  });
});
