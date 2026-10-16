import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAdapterSettings,
  createScormAdapter,
  exposeAdapter,
  initializeCommitSequence,
  initializeEventName,
  terminateEventName
} from './adapter';
import { Scorm12API } from 'scorm-again/scorm12';
import { Scorm2004API } from 'scorm-again/scorm2004';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('adapter settings', () => {
  it('commits synchronously in small numbered deltas without self-reported time', () => {
    const settings = buildAdapterSettings('launch-token', false);

    expect(settings).toMatchObject({
      autocommit: true,
      autocommitSeconds: 30,
      lmsCommitUrl: '/activity/scorm/runtime/launch-token/commit',
      sendFullCommit: false,
      includeCommitSequence: true,
      selfReportSessionTime: false,
      logLevel: 4,
      autoCompleteLessonStatus: false,
      mastery_override: false
    });
  });

  it('raises logging in debug launches', () => {
    const settings = buildAdapterSettings('launch-token', true);

    expect(settings?.logLevel).toBe(1);
  });
});

describe('adapter creation', () => {
  it('creates the API matching the package format', () => {
    expect(createScormAdapter('scorm12', buildAdapterSettings('t', false))).toBeInstanceOf(Scorm12API);
    expect(createScormAdapter('scorm2004', buildAdapterSettings('t', false))).toBeInstanceOf(Scorm2004API);
  });

  it('throws for unknown formats', () => {
    expect(() => createScormAdapter('cmi5' as never, buildAdapterSettings('t', false))).toThrow();
  });
});

describe('adapter exposure', () => {
  it('exposes each API where packages discover it', () => {
    const fakeWindow: { API?: unknown; API_1484_11?: unknown } = {};
    vi.stubGlobal('window', fakeWindow);

    exposeAdapter('scorm12', createScormAdapter('scorm12', buildAdapterSettings('t', false)));
    exposeAdapter('scorm2004', createScormAdapter('scorm2004', buildAdapterSettings('t', false)));

    expect(fakeWindow.API).toBeInstanceOf(Scorm12API);
    expect(fakeWindow.API_1484_11).toBeInstanceOf(Scorm2004API);
  });

  it('throws when the global is already set', () => {
    const fakeWindow = { API: {} };
    vi.stubGlobal('window', fakeWindow);

    expect(() => exposeAdapter('scorm12', createScormAdapter('scorm12', buildAdapterSettings('t', false)))).toThrow();
  });
});

describe('event names', () => {
  it('uses the versioned initialize and terminate events', () => {
    expect(initializeEventName('scorm12')).toBe('LMSInitialize');
    expect(initializeEventName('scorm2004')).toBe('Initialize');
    expect(terminateEventName('scorm12')).toBe('LMSFinish');
    expect(terminateEventName('scorm2004')).toBe('Terminate');
  });
});

describe('commit response', () => {
  function fakeXhr(status: number, responseText: string): XMLHttpRequest {
    return { status, responseText } as XMLHttpRequest;
  }

  function responseHandler(
    onCompleted?: () => void,
    onProgress?: () => void
  ): (xhr: XMLHttpRequest) => { result: string | boolean; errorCode: number } {
    const settings = buildAdapterSettings('t', false, onCompleted, onProgress);

    if (!settings || !settings.xhrResponseHandler) throw new Error('commit response handler is missing');

    return settings.xhrResponseHandler;
  }

  it('forwards the scorm-again result shape', () => {
    const handler = responseHandler();

    expect(handler(fakeXhr(200, '{"result":true,"errorCode":0}'))).toEqual({ result: true, errorCode: 0 });
    expect(handler(fakeXhr(200, '{"result":"true","errorCode":0}'))).toEqual({ result: 'true', errorCode: 0 });
    expect(handler(fakeXhr(200, 'not json'))).toEqual({ result: true, errorCode: 0 });
    expect(handler(fakeXhr(500, '{}'))).toEqual({ result: false, errorCode: 101 });
  });

  it('notifies when the server reports completion', () => {
    const onCompleted = vi.fn();

    responseHandler(onCompleted)(fakeXhr(200, '{"result":true,"errorCode":0,"completedActivity":true}'));

    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('stays silent without a completion flag', () => {
    const onCompleted = vi.fn();

    responseHandler(onCompleted)(fakeXhr(200, '{"result":true,"errorCode":0,"completedActivity":false}'));

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('notifies progress when a module outcome changed', () => {
    const onCompleted = vi.fn();
    const onProgress = vi.fn();

    responseHandler(
      onCompleted,
      onProgress
    )(fakeXhr(200, '{"result":true,"errorCode":0,"completedActivity":false,"progressChanged":true}'));

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('reports completion alone when both flags are set', () => {
    const onCompleted = vi.fn();
    const onProgress = vi.fn();

    responseHandler(
      onCompleted,
      onProgress
    )(fakeXhr(200, '{"result":true,"errorCode":0,"completedActivity":true,"progressChanged":true}'));

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onProgress).not.toHaveBeenCalled();
  });
});

describe('commit sequence', () => {
  it('continues above the stored sequence after resume', () => {
    const adapter = createScormAdapter('scorm12', buildAdapterSettings('t', false));

    initializeCommitSequence(adapter, 14);

    expect((adapter as unknown as { _commitSequence: number })._commitSequence).toBe(14);
  });

  it('ignores invalid sequence values', () => {
    const adapter = createScormAdapter('scorm2004', buildAdapterSettings('t', false));

    initializeCommitSequence(adapter, Number.NaN);

    expect((adapter as unknown as { _commitSequence: number })._commitSequence).toBe(0);
  });
});
