import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scorm12API } from 'scorm-again/scorm12';

import { buildAdapterSettings } from './adapter';
import {
  createRuntimeHttpService,
  diffCmi,
  isPageUnloading,
  readCommitResponse,
  watchPageUnload
} from './runtime-http';

interface SentRequest {
  url: string;
  async: boolean;
  contentType: string | null;
  body: Record<string, unknown>;
  keepalive?: boolean;
}

let sent: SentRequest[] = [];
let nextResponse: { status: number; body: string } = { status: 200, body: '{"result":true,"errorCode":0}' };
let throwOnSend = false;
let beacons: Array<{ url: string; body: string }> = [];

class FakeXhr {
  status = 0;
  responseText = '';
  private url = '';
  private async = true;
  private contentType: string | null = null;

  open(_method: string, url: string, async: boolean) {
    this.url = url;
    this.async = async;
  }

  setRequestHeader(name: string, value: string) {
    if (name.toLowerCase() === 'content-type') this.contentType = value;
  }

  send(body: string) {
    if (throwOnSend) throw new Error('Synchronous requests are blocked during unload');

    sent.push({ url: this.url, async: this.async, contentType: this.contentType, body: JSON.parse(body) });
    this.status = nextResponse.status;
    this.responseText = nextResponse.body;
  }
}

function beaconBody(index: number): Record<string, unknown> {
  return JSON.parse(beacons[index].body) as Record<string, unknown>;
}

beforeEach(() => {
  sent = [];
  beacons = [];
  throwOnSend = false;
  nextResponse = { status: 200, body: '{"result":true,"errorCode":0}' };
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const bodyStr = String(init?.body ?? '{}');
    const headers = init?.headers as Record<string, string> | undefined;
    sent.push({
      url,
      async: true,
      contentType: headers?.['Content-Type'] ?? null,
      body: JSON.parse(bodyStr),
      keepalive: init?.keepalive === true
    });
    return {
      status: nextResponse.status,
      text: async () => nextResponse.body
    } as Response;
  });
  vi.stubGlobal('navigator', {
    sendBeacon: vi.fn((url: string, body: string) => {
      beacons.push({ url, body });
      return true;
    })
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readCommitResponse', () => {
  it('forwards the scorm-again result shape', () => {
    expect(readCommitResponse(200, '{"result":true,"errorCode":0}')).toEqual({ result: true, errorCode: 0 });
    expect(readCommitResponse(200, '{"result":"true","errorCode":0}')).toEqual({ result: 'true', errorCode: 0 });
    expect(readCommitResponse(200, '{"result":false,"errorCode":101}')).toEqual({ result: false, errorCode: 101 });
    expect(readCommitResponse(200, 'not json')).toEqual({ result: true, errorCode: 0 });
    expect(readCommitResponse(500, '{}')).toEqual({ result: false, errorCode: 101 });
  });

  it('reports completion alone when both flags are set, otherwise progress', () => {
    const onCompleted = vi.fn();
    const onProgress = vi.fn();

    readCommitResponse(200, '{"result":true,"completedActivity":true,"progressChanged":true}', {
      onCompleted,
      onProgress
    });
    readCommitResponse(200, '{"result":true,"completedActivity":false,"progressChanged":true}', {
      onCompleted,
      onProgress
    });
    readCommitResponse(200, '{"result":true,"completedActivity":false}', { onCompleted, onProgress });

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });
});

describe('diffCmi', () => {
  it('keeps only changed leaves with their nesting', () => {
    const baseline = { core: { lesson_status: 'incomplete', score: { raw: '10' } }, suspend_data: 'abc' };
    const current = { core: { lesson_status: 'passed', score: { raw: '10' } }, suspend_data: 'abc' };

    expect(diffCmi(current, baseline)).toEqual({ core: { lesson_status: 'passed' } });
  });

  it('returns undefined when nothing changed and everything when there is no baseline', () => {
    const cmi = { core: { lesson_status: 'incomplete' }, interactions: { '0': { id: 'q1' } } };

    expect(diffCmi(cmi, structuredClone(cmi))).toBeUndefined();
    expect(diffCmi(cmi, undefined)).toEqual(cmi);
  });

  it('sends new collection entries keyed by index', () => {
    const baseline = { interactions: { '0': { id: 'q1', result: 'correct' } } };
    const current = { interactions: { '0': { id: 'q1', result: 'correct' }, '1': { id: 'q2', result: 'wrong' } } };

    expect(diffCmi(current, baseline)).toEqual({ interactions: { '1': { id: 'q2', result: 'wrong' } } });
  });

  it('compares arrays whole', () => {
    expect(diffCmi({ list: [1, 2] }, { list: [1, 2] })).toBeUndefined();
    expect(diffCmi({ list: [1, 3] }, { list: [1, 2] })).toEqual({ list: [1, 3] });
  });
});

describe('createRuntimeHttpService', () => {
  const commit = (cmi: Record<string, unknown>, sequence: number, terminate = false) => ({
    cmi,
    commitSequence: sequence,
    ...(terminate ? { terminate: true } : {})
  });

  const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('sends the full state first, then only what changed since the last accepted save', async () => {
    const service = createRuntimeHttpService({ isPageUnloading: () => false });

    service.processHttpRequest(
      '/commit',
      commit({ core: { lesson_status: 'incomplete' }, suspend_data: 'x'.repeat(50) }, 1),
      false,
      vi.fn(),
      vi.fn()
    );
    await flushMicrotasks();

    service.processHttpRequest(
      '/commit',
      commit({ core: { lesson_status: 'passed' }, suspend_data: 'x'.repeat(50) }, 2),
      false,
      vi.fn(),
      vi.fn()
    );
    await flushMicrotasks();

    expect(sent[0].body.cmi).toEqual({ core: { lesson_status: 'incomplete' }, suspend_data: 'x'.repeat(50) });
    expect(sent[1].body).toEqual({ cmi: { core: { lesson_status: 'passed' } }, commitSequence: 2 });
    expect(sent[1].async).toBe(true);
    expect(sent[1].contentType).toBe('application/json');
  });

  it('keeps quick saves alive while the page is hiding', async () => {
    const service = createRuntimeHttpService({ isPageUnloading: () => true });

    service.processHttpRequest('/commit', commit({ core: { lesson_location: 'page-1' } }, 1), false, vi.fn(), vi.fn());
    await flushMicrotasks();

    expect(sent).toHaveLength(1);
    expect(sent[0].keepalive).toBe(true);
  });

  it('queues quick saves so each diff starts from the last acknowledged state', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let requestCount = 0;

    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      const bodyStr = String(init?.body ?? '{}');
      const headers = init?.headers as Record<string, string> | undefined;
      sent.push({
        url,
        async: true,
        contentType: headers?.['Content-Type'] ?? null,
        body: JSON.parse(bodyStr)
      });
      requestCount += 1;

      if (requestCount === 1) await firstGate;

      return {
        status: 200,
        text: async () => '{"result":true,"errorCode":0}'
      } as Response;
    });

    const service = createRuntimeHttpService({ isPageUnloading: () => false });

    service.processHttpRequest('/commit', commit({ core: { lesson_location: 'page-1' } }, 1), false, vi.fn(), vi.fn());
    await flushMicrotasks();

    service.processHttpRequest('/commit', commit({ core: { lesson_location: 'page-2' } }, 2), false, vi.fn(), vi.fn());
    service.processHttpRequest('/commit', commit({ core: { lesson_location: 'page-1' } }, 3), false, vi.fn(), vi.fn());
    await flushMicrotasks();

    expect(sent).toHaveLength(1);

    releaseFirst?.();
    await flushMicrotasks();

    expect(sent).toHaveLength(3);
    expect(sent[1].body.cmi).toEqual({ core: { lesson_location: 'page-2' } });
    expect(sent[2].body.cmi).toEqual({ core: { lesson_location: 'page-1' } });
  });

  it('re-sends changes the server refused', async () => {
    const service = createRuntimeHttpService({ isPageUnloading: () => false });

    service.processHttpRequest(
      '/commit',
      commit({ core: { lesson_status: 'incomplete' } }, 1),
      false,
      vi.fn(),
      vi.fn()
    );
    await flushMicrotasks();

    nextResponse = { status: 200, body: '{"result":false,"errorCode":101}' };
    service.processHttpRequest('/commit', commit({ core: { lesson_status: 'passed' } }, 2), false, vi.fn(), vi.fn());
    await flushMicrotasks();

    nextResponse = { status: 200, body: '{"result":true,"errorCode":0}' };
    service.processHttpRequest(
      '/commit',
      commit({ core: { lesson_status: 'passed' }, suspend_data: 'y' }, 3),
      false,
      vi.fn(),
      vi.fn()
    );
    await flushMicrotasks();

    expect(sent[2].body.cmi).toEqual({ core: { lesson_status: 'passed' }, suspend_data: 'y' });
  });

  it('reads the exit save response while the page is open', () => {
    const onCompleted = vi.fn();
    const service = createRuntimeHttpService({ onCompleted, isPageUnloading: () => false });
    nextResponse = { status: 200, body: '{"result":true,"errorCode":0,"completedActivity":true}' };

    const result = service.processHttpRequest(
      '/commit',
      commit({ core: { lesson_status: 'completed' } }, 1, true),
      true,
      vi.fn(),
      vi.fn()
    );

    expect(result).toEqual({ result: true, errorCode: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0].body.terminate).toBe(true);
    expect(sent[0].async).toBe(false);
    expect(beacons).toHaveLength(0);
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('beacons the exit save once the page is unloading', async () => {
    const service = createRuntimeHttpService({ isPageUnloading: () => true });

    const result = service.processHttpRequest(
      '/commit',
      commit({ core: { exit: 'suspend' } }, 4, true),
      true,
      vi.fn(),
      vi.fn()
    );

    expect(result).toEqual({ result: true, errorCode: 0 });
    expect(sent).toHaveLength(0);
    expect(beaconBody(0)).toEqual({ cmi: { core: { exit: 'suspend' } }, commitSequence: 4, terminate: true });
  });

  it('falls back to a beacon when the browser blocks the synchronous exit save', () => {
    const service = createRuntimeHttpService({ isPageUnloading: () => false });
    throwOnSend = true;

    const exit = service.processHttpRequest('/commit', commit({ core: { exit: '' } }, 1, true), true, vi.fn(), vi.fn());

    expect(exit).toEqual({ result: true, errorCode: 0 });
    expect(beacons).toHaveLength(1);
  });

  it('sends only changed fields from a real SCORM 1.2 session and reads the finish response', async () => {
    const onCompleted = vi.fn();
    const settings = { ...buildAdapterSettings('launch-token', false, onCompleted), autocommit: false };
    const adapter = new Scorm12API(settings);

    adapter.LMSInitialize('');
    adapter.LMSSetValue('cmi.suspend_data', 'state'.repeat(200));
    adapter.LMSCommit('');
    await flushMicrotasks();

    adapter.LMSSetValue('cmi.core.lesson_location', 'page-2');
    adapter.LMSCommit('');
    await flushMicrotasks();

    nextResponse = { status: 200, body: '{"result":true,"errorCode":0,"completedActivity":true}' };
    adapter.LMSSetValue('cmi.core.lesson_status', 'completed');
    adapter.LMSFinish('');

    const second = sent[1].body.cmi as { core?: Record<string, unknown>; suspend_data?: unknown };
    const finish = sent[2].body as { cmi: { core?: Record<string, unknown> }; terminate?: boolean };

    expect(sent).toHaveLength(3);
    expect(sent[0].async).toBe(true);
    expect(sent[1].async).toBe(true);
    expect(sent[2].async).toBe(false);
    expect(second.suspend_data).toBeUndefined();
    expect(second.core?.lesson_location).toBe('page-2');
    expect(finish.terminate).toBe(true);
    expect(finish.cmi.core?.lesson_status).toBe('completed');
    expect(beacons).toHaveLength(0);
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});

describe('watchPageUnload', () => {
  it('flags the page while it unloads and clears the flag when restored from cache', () => {
    const listeners = new Map<string, (event: { persisted: boolean }) => void>();
    vi.stubGlobal('window', {
      addEventListener: (type: string, callback: (event: { persisted: boolean }) => void) =>
        listeners.set(type, callback),
      removeEventListener: (type: string) => listeners.delete(type)
    });

    const stop = watchPageUnload();
    listeners.get('pagehide')?.({ persisted: true });
    expect(isPageUnloading()).toBe(true);

    listeners.get('pageshow')?.({ persisted: true });
    expect(isPageUnloading()).toBe(false);

    stop();
    expect(listeners.size).toBe(0);
  });
});
