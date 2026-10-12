import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAdapterSettings,
  createScormAdapter,
  exposeAdapter,
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
