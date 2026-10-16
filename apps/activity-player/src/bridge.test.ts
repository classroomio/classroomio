import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scorm12API } from 'scorm-again/scorm12';
import { Scorm2004API } from 'scorm-again/scorm2004';
import {
  DID_NOT_CONNECT_MS,
  connectParentBridge,
  finishRunningModule,
  flushOnPageHide,
  notifyBootError,
  notifyCompleted,
  notifyFullscreenUnavailable,
  requestExitImmersive,
  requestNavigation,
  watchForConnection,
  type PlayerOutboundMessage
} from './bridge';
import { buildAdapterSettings } from './scorm/adapter';

interface FakeTarget {
  postMessage: (message: unknown, origin: string) => void;
}

interface FakeWindow {
  opener: FakeTarget | null;
  parent: FakeTarget | object | null;
  listeners: Map<string, Array<() => void>>;
  addEventListener: (type: string, callback: () => void) => void;
  removeEventListener: (type: string, callback: () => void) => void;
  setTimeout: (callback: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
}

function fakeTarget(): FakeTarget {
  return { postMessage: vi.fn() };
}

function installWindow(opener: FakeTarget | null, parent: FakeTarget | object | null): FakeWindow {
  const listeners = new Map<string, Array<() => void>>();
  const fakeWindow: FakeWindow = {
    opener,
    parent,
    listeners,
    addEventListener: (type: string, callback: () => void) => {
      const existing = listeners.get(type) ?? [];
      existing.push(callback);
      listeners.set(type, existing);
    },
    removeEventListener: (type: string, callback: () => void) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((registered) => registered !== callback)
      );
    },
    setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimeout: (id: unknown) => clearTimeout(id as NodeJS.Timeout)
  };

  vi.stubGlobal('window', fakeWindow);

  return fakeWindow;
}

function postedTo(target: FakeTarget): PlayerOutboundMessage[] {
  return vi.mocked(target.postMessage).mock.calls.map((call) => call[0] as PlayerOutboundMessage);
}

function targetOrigins(target: FakeTarget): string[] {
  return vi.mocked(target.postMessage).mock.calls.map((call) => call[1] as string);
}

const stubHttpService = {
  processHttpRequest: () => ({ result: 'true', errorCode: 0 }),
  updateSettings: () => {}
};

function testSettings() {
  return { ...buildAdapterSettings('launch-token', false), autocommit: false };
}

function create12() {
  return new Scorm12API(testSettings(), stubHttpService as never);
}

function create2004() {
  return new Scorm2004API(testSettings(), stubHttpService as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parent messaging', () => {
  it('posts ready to the embedded parent with its exact origin', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    connectParentBridge(create12(), 'scorm12', 'https://app.test');

    expect(postedTo(parent)).toEqual([{ type: 'ready' }]);
    expect(targetOrigins(parent)).toEqual(['https://app.test']);
  });

  it('posts to the opener only in a new window', () => {
    const opener = fakeTarget();
    const fakeWindow = installWindow(opener, null);
    fakeWindow.parent = fakeWindow as unknown as object;

    connectParentBridge(create2004(), 'scorm2004', 'https://app.test');

    expect(postedTo(opener)).toEqual([{ type: 'ready' }]);
    expect(targetOrigins(opener)).toEqual(['https://app.test']);
  });

  it('posts to both parent and opener when nested with an opener', () => {
    const opener = fakeTarget();
    const parent = fakeTarget();
    installWindow(opener, parent);

    connectParentBridge(create12(), 'scorm12', 'https://app.test');

    expect(postedTo(parent)).toEqual([{ type: 'ready' }]);
    expect(postedTo(opener)).toEqual([{ type: 'ready' }]);
  });

  it('posts ready to all parent origins when an array of origins is provided', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    connectParentBridge(create12(), 'scorm12', ['https://app.test', 'https://tenant.test']);

    expect(postedTo(parent)).toEqual([{ type: 'ready' }, { type: 'ready' }]);
    expect(targetOrigins(parent)).toEqual(['https://app.test', 'https://tenant.test']);
  });
});

describe('package connection', () => {
  it('posts initialized when a 1.2 package initializes', () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create12();

    connectParentBridge(adapter, 'scorm12', 'https://app.test');
    adapter.LMSInitialize('');

    expect(postedTo(parent)).toEqual([{ type: 'ready' }, { type: 'initialized' }]);
  });

  it('posts initialized when a 2004 package initializes', () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create2004();

    connectParentBridge(adapter, 'scorm2004', 'https://app.test');
    adapter.Initialize('');

    expect(postedTo(parent)).toEqual([{ type: 'ready' }, { type: 'initialized' }]);
  });
});

describe('terminate and navigation requests', () => {
  it('reports the 2004 navigation request captured at SetValue time', () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create2004();
    const seen: Array<string | null> = [];

    connectParentBridge(adapter, 'scorm2004', 'https://app.test', (navRequest) => seen.push(navRequest));
    adapter.Initialize('');
    adapter.SetValue('adl.nav.request', 'continue');
    adapter.Terminate('');

    expect(postedTo(parent)).toContainEqual({ type: 'terminated', navRequest: 'continue' });
    expect(seen).toEqual(['continue']);
  });

  it('forwards every navigation request verbatim for the parent to interpret', () => {
    for (const value of [
      'continue',
      'previous',
      'exit',
      'exitAll',
      '_next_',
      '_previous_',
      'choice.{target=sco2}',
      'choice.sco2'
    ]) {
      const parent = fakeTarget();
      installWindow(null, parent);
      const adapter = create2004();
      const seen: Array<string | null> = [];

      connectParentBridge(adapter, 'scorm2004', 'https://app.test', (navRequest) => seen.push(navRequest));
      adapter.Initialize('');
      adapter.SetValue('adl.nav.request', value);
      adapter.Terminate('');

      expect(postedTo(parent)).toContainEqual({ type: 'terminated', navRequest: value });
      expect(seen).toEqual([value]);
    }
  });

  it('trims whitespace around navigation requests', () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create2004();

    connectParentBridge(adapter, 'scorm2004', 'https://app.test');
    adapter.Initialize('');
    adapter.SetValue('adl.nav.request', '  continue  ');
    adapter.Terminate('');

    expect(postedTo(parent)).toContainEqual({ type: 'terminated', navRequest: 'continue' });
  });

  it('treats empty and _none_ navigation requests as absent', () => {
    for (const value of ['', '_none_']) {
      const parent = fakeTarget();
      installWindow(null, parent);
      const adapter = create2004();

      connectParentBridge(adapter, 'scorm2004', 'https://app.test');
      adapter.Initialize('');
      adapter.SetValue('adl.nav.request', value);
      adapter.Terminate('');

      expect(postedTo(parent)).toContainEqual({ type: 'terminated', navRequest: null });
    }
  });

  it('falls back to the stored request without calling GetValue', () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create2004();
    const getValue = vi.spyOn(adapter, 'GetValue');

    connectParentBridge(adapter, 'scorm2004', 'https://app.test');
    adapter.Initialize('');
    (adapter.adl as unknown as { nav: { _request: string } }).nav._request = 'continue';
    adapter.Terminate('');

    expect(postedTo(parent)).toContainEqual({ type: 'terminated', navRequest: 'continue' });
    expect(getValue).not.toHaveBeenCalled();
  });

  it('never reports a navigation request for SCORM 1.2', () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create12();

    connectParentBridge(adapter, 'scorm12', 'https://app.test');
    adapter.LMSInitialize('');
    adapter.LMSFinish('');

    expect(postedTo(parent)).toContainEqual({ type: 'terminated', navRequest: null });
  });
});

describe('completion', () => {
  it('notifies the parent when the server reports completion', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    notifyCompleted('https://app.test');

    expect(postedTo(parent)).toEqual([{ type: 'completed' }]);
    expect(targetOrigins(parent)).toEqual(['https://app.test']);
  });
});

describe('did-not-connect', () => {
  it('waits 30 seconds for the package to initialize', () => {
    expect(DID_NOT_CONNECT_MS).toBe(30_000);
  });

  it('resolves true when already initialized', async () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create12();
    adapter.LMSInitialize('');

    await expect(watchForConnection(adapter, 'scorm12', 'https://app.test', 5)).resolves.toBe(true);
    expect(postedTo(parent)).toEqual([]);
  });

  it('reports packages that never initialize', async () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    await expect(watchForConnection(create12(), 'scorm12', 'https://app.test', 5)).resolves.toBe(false);
    expect(postedTo(parent)).toEqual([{ type: 'did-not-connect' }]);
  });

  it('resolves true when initialization lands in time', async () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const adapter = create2004();

    const pending = watchForConnection(adapter, 'scorm2004', 'https://app.test', 50);
    setTimeout(() => adapter.Initialize(''), 5);

    await expect(pending).resolves.toBe(true);
    expect(postedTo(parent)).toEqual([]);
  });
});

describe('pagehide flush', () => {
  function pagehide(fakeWindow: FakeWindow) {
    for (const callback of fakeWindow.listeners.get('pagehide') ?? []) callback();
  }

  it('does nothing before initialization', () => {
    const fakeWindow = installWindow(null, fakeTarget());
    const adapter = create12();
    const finish = vi.spyOn(adapter, 'LMSFinish');

    flushOnPageHide(adapter, 'scorm12');
    pagehide(fakeWindow);

    expect(finish).not.toHaveBeenCalled();
  });

  it('finishes a running 1.2 module when the page hides', () => {
    const fakeWindow = installWindow(null, fakeTarget());
    const adapter = create12();
    const finish = vi.spyOn(adapter, 'LMSFinish');

    flushOnPageHide(adapter, 'scorm12');
    adapter.LMSInitialize('');
    pagehide(fakeWindow);

    expect(finish).toHaveBeenCalledTimes(1);
  });

  it('terminates a running 2004 module when the page hides', () => {
    const fakeWindow = installWindow(null, fakeTarget());
    const adapter = create2004();
    const terminate = vi.spyOn(adapter, 'Terminate');

    flushOnPageHide(adapter, 'scorm2004');
    adapter.Initialize('');
    pagehide(fakeWindow);

    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it('does nothing once the module already terminated', () => {
    const fakeWindow = installWindow(null, fakeTarget());
    const adapter = create2004();
    const terminate = vi.spyOn(adapter, 'Terminate');

    flushOnPageHide(adapter, 'scorm2004');
    adapter.Initialize('');
    adapter.Terminate('');
    pagehide(fakeWindow);

    expect(terminate).toHaveBeenCalledTimes(1);
  });
});

describe('module sessions', () => {
  const channel = { origins: ['https://app.test', 'https://acme.test'], session: 3 };

  it('tags every message with the session number', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    connectParentBridge(create12(), 'scorm12', channel);
    notifyCompleted(channel);

    expect(postedTo(parent)).toEqual([
      { type: 'ready', session: 3 },
      { type: 'ready', session: 3 },
      { type: 'completed', session: 3 },
      { type: 'completed', session: 3 }
    ]);
    expect(targetOrigins(parent)).toEqual([
      'https://app.test',
      'https://acme.test',
      'https://app.test',
      'https://acme.test'
    ]);
  });

  it('asks the embedder to open another module', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    requestNavigation('https://app.test', 'next', null);
    requestNavigation('https://app.test', 'select', 'module-2');

    expect(postedTo(parent)).toEqual([
      { type: 'nav', action: 'next', identifier: null },
      { type: 'nav', action: 'select', identifier: 'module-2' }
    ]);
  });

  it('asks the embedder to leave its fullscreen or full-window mode', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    requestExitImmersive('https://app.test');

    expect(postedTo(parent)).toEqual([{ type: 'exit-immersive' }]);
  });

  it('reports when the player could not take fullscreen', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    notifyFullscreenUnavailable({ origins: ['https://app.test'], session: 1 });

    expect(postedTo(parent)).toEqual([{ type: 'fullscreen-unavailable', session: 1 }]);
  });

  it('includes the session in boot errors when known', () => {
    const parent = fakeTarget();
    installWindow(null, parent);

    notifyBootError('Launch state request failed: 401', 2);

    expect(postedTo(parent)).toEqual([{ type: 'boot-error', error: 'Launch state request failed: 401', session: 2 }]);
    expect(targetOrigins(parent)).toEqual(['*']);
  });

  it('stops watching for a connection once aborted', async () => {
    const parent = fakeTarget();
    installWindow(null, parent);
    const controller = new AbortController();

    const pending = watchForConnection(create12(), 'scorm12', channel, 20, controller.signal);
    controller.abort();
    await new Promise((resolve) => setTimeout(resolve, 40));

    await expect(pending).resolves.toBe(false);
    expect(postedTo(parent)).toEqual([]);
  });

  it('stops flushing on page hide once the module ended', () => {
    const fakeWindow = installWindow(null, fakeTarget());
    const adapter = create12();
    const finish = vi.spyOn(adapter, 'LMSFinish');

    const stop = flushOnPageHide(adapter, 'scorm12');
    adapter.LMSInitialize('');
    stop();
    for (const callback of fakeWindow.listeners.get('pagehide') ?? []) callback();

    expect(finish).not.toHaveBeenCalled();
  });

  it('finishes a running module on demand, once', () => {
    installWindow(null, fakeTarget());
    const adapter = create2004();
    const terminate = vi.spyOn(adapter, 'Terminate');

    finishRunningModule(adapter, 'scorm2004');
    adapter.Initialize('');
    finishRunningModule(adapter, 'scorm2004');
    finishRunningModule(adapter, 'scorm2004');

    expect(terminate).toHaveBeenCalledTimes(1);
  });
});
