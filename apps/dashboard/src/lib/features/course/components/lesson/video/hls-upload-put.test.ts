import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ConcurrencyGate,
  HlsEncoderError,
  executeCancellableConversion,
  putAttemptTimeoutMs,
  putPresignedObject
} from './hls-upload-put';
import type { PresignedUrl } from './types';

const SEGMENT_BYTES = 1_000_000;

function presignedUrl(url = 'https://r2.example/seg-00001.ts'): PresignedUrl {
  return { url, key: 'asset/seg-00001.ts', createdAt: Date.now() };
}

function buildPut(overrides: Partial<Parameters<typeof putPresignedObject>[0]> = {}) {
  const onFailure = vi.fn();
  const onNetworkFailure = vi.fn();
  const refreshPresign = vi.fn(async () => presignedUrl('https://r2.example/refreshed'));
  const options = {
    path: 'p720/seg-00001.ts',
    presigned: presignedUrl(),
    body: new Blob([new Uint8Array(SEGMENT_BYTES)]),
    contentType: 'video/mp2t',
    getConcurrency: () => 16,
    refreshPresign,
    onNetworkFailure,
    onFailure,
    ...overrides
  };

  return { options, onFailure, onNetworkFailure, refreshPresign };
}

function hangingFetch() {
  return (_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    });
}

describe('putPresignedObject', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('retries after a network rejection and succeeds', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { options, onFailure, onNetworkFailure } = buildPut();

    const result = putPresignedObject(options);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe(options.presigned);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onNetworkFailure).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('throws and records the failure after four network rejections', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { options, onFailure } = buildPut();

    const result = putPresignedObject(options);
    const assertion = expect(result).rejects.toThrow('Failed to fetch');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 4, httpStatus: null, errorName: 'TypeError' })
    );
  });

  it('aborts a stalled PUT at its deadline and retries', async () => {
    fetchMock.mockImplementationOnce(hangingFetch()).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { options, onNetworkFailure } = buildPut();

    const result = putPresignedObject(options);
    await vi.advanceTimersByTimeAsync(putAttemptTimeoutMs(SEGMENT_BYTES, 16));
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe(options.presigned);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onNetworkFailure).toHaveBeenCalledTimes(1);
  });

  it('stops without another attempt when the caller cancels during a request', async () => {
    fetchMock.mockImplementation(hangingFetch());
    const controller = new AbortController();
    const { options, onFailure, onNetworkFailure } = buildPut({ signal: controller.signal });

    const result = putPresignedObject(options);
    const assertion = expect(result).rejects.toBeDefined();
    controller.abort();
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onNetworkFailure).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('stops without another attempt when the caller cancels during the retry wait', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const controller = new AbortController();
    const { options } = buildPut({ signal: controller.signal });

    const result = putPresignedObject(options);
    const assertion = expect(result).rejects.toBeDefined();
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes the presign after a 403 and retries with the new URL', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { options, refreshPresign } = buildPut();

    const result = putPresignedObject(options);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toMatchObject({ url: 'https://r2.example/refreshed' });
    expect(refreshPresign).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://r2.example/refreshed');
  });

  it('does not retry a 400', async () => {
    fetchMock.mockResolvedValue(new Response('bad', { status: 400 }));
    const { options } = buildPut();

    await expect(putPresignedObject(options)).rejects.toBeInstanceOf(HlsEncoderError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('putAttemptTimeoutMs', () => {
  it('never goes below two minutes', () => {
    expect(putAttemptTimeoutMs(1000, 1)).toBe(120_000);
  });

  it('grows with body size and concurrency so a shared slow uplink is not cut off', () => {
    expect(putAttemptTimeoutMs(1_250_000, 16)).toBe(312_500);
    expect(putAttemptTimeoutMs(1_250_000, 8)).toBe(156_250);
  });
});

describe('ConcurrencyGate', () => {
  it('halves the limit down to the minimum', () => {
    const gate = new ConcurrencyGate(16, 2);

    gate.reduce();
    expect(gate.currentLimit).toBe(8);
    gate.reduce();
    gate.reduce();
    gate.reduce();
    expect(gate.currentLimit).toBe(2);
  });

  it('starts no more queued tasks than the reduced limit allows', async () => {
    const gate = new ConcurrencyGate(4, 1);
    let running = 0;
    let peak = 0;
    const releases: (() => void)[] = [];
    const task = () =>
      gate.run(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise<void>((resolve) => releases.push(resolve));
        running -= 1;
      });

    const tasks = Array.from({ length: 8 }, task);
    await Promise.resolve();
    expect(running).toBe(4);

    gate.reduce();
    gate.reduce();
    peak = 0;
    for (const release of releases.splice(0)) release();
    while (releases.length || running) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(running).toBeLessThanOrEqual(1);
      for (const release of releases.splice(0)) release();
    }
    await Promise.all(tasks);

    expect(peak).toBeLessThanOrEqual(1);
  });
});

describe('executeCancellableConversion', () => {
  function fakeConversion() {
    let rejectExecute: (reason: Error) => void = () => undefined;
    let finishCancel: () => void = () => undefined;
    const execute = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectExecute = reject;
        })
    );
    const cancel = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishCancel = resolve;
        })
    );

    return {
      conversion: { execute, cancel },
      rejectExecute: (reason: Error) => rejectExecute(reason),
      finishCancel: () => finishCancel()
    };
  }

  it('cancels the conversion when the signal aborts', async () => {
    const { conversion, rejectExecute, finishCancel } = fakeConversion();
    const controller = new AbortController();
    const run = executeCancellableConversion(conversion, controller.signal);

    controller.abort();
    rejectExecute(new Error('canceled'));
    finishCancel();

    await expect(run).rejects.toThrow('canceled');
    expect(conversion.cancel).toHaveBeenCalledTimes(1);
  });

  it('does not settle until the cancellation has finished', async () => {
    const { conversion, rejectExecute, finishCancel } = fakeConversion();
    const controller = new AbortController();
    const onSettled = vi.fn();
    const run = executeCancellableConversion(conversion, controller.signal).catch(onSettled);

    controller.abort();
    rejectExecute(new Error('canceled'));
    await Promise.resolve();
    await Promise.resolve();

    expect(onSettled).not.toHaveBeenCalled();

    finishCancel();
    await run;

    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('cancels at once when the signal is already aborted', async () => {
    const { conversion, rejectExecute, finishCancel } = fakeConversion();
    const controller = new AbortController();
    controller.abort();
    const run = executeCancellableConversion(conversion, controller.signal);

    rejectExecute(new Error('canceled'));
    finishCancel();

    await expect(run).rejects.toThrow('canceled');
    expect(conversion.cancel).toHaveBeenCalledTimes(1);
  });

  it('never cancels a conversion that finishes without an abort', async () => {
    const conversion = { execute: vi.fn(async () => undefined), cancel: vi.fn(async () => undefined) };

    await executeCancellableConversion(conversion, new AbortController().signal);

    expect(conversion.cancel).not.toHaveBeenCalled();
  });
});
