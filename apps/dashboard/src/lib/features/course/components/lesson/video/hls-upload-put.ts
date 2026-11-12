import type { HlsUploadFailureContext, PresignedUrl } from './types';

/** Cap parallel segment PUTs — unbounded concurrency can overwhelm R2 and fail mid-upload. */
export const HLS_UPLOAD_CONCURRENCY = 16;
export const HLS_MIN_UPLOAD_CONCURRENCY = 2;
const HLS_PUT_MAX_ATTEMPTS = 4;
const HLS_PUT_MIN_TIMEOUT_MS = 120_000;
/** Slowest uplink an upload should survive; concurrent PUTs are assumed to share it evenly. */
const HLS_MIN_UPLINK_BYTES_PER_SECOND = 64_000;
const HLS_PUT_MAX_RETRY_DELAY_MS = 8000;

export class HlsEncoderError extends Error {
  constructor(
    public code: 'webcodecs_unsupported' | 'encode_failed' | 'upload_failed' | 'finalize_failed',
    message: string
  ) {
    super(message);
    this.name = 'HlsEncoderError';
  }
}

/**
 * Resolves after `ms`, or rejects with the signal's reason as soon as `signal` aborts.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Runs at most `limit` tasks at once. `reduce()` halves the limit (never below `minLimit`) for tasks not yet started.
 */
export class ConcurrencyGate {
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(
    private limit: number,
    private readonly minLimit = 1
  ) {}

  get currentLimit(): number {
    return this.limit;
  }

  reduce(): void {
    this.limit = Math.max(this.minLimit, Math.floor(this.limit / 2));
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();

    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active += 1;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active -= 1;

    while (this.active < this.limit) {
      const next = this.queue.shift();
      if (!next) return;

      next();
    }
  }
}

/**
 * Deadline for one PUT, sized so `concurrency` parallel bodies of `bytes` each still finish on the slowest supported uplink.
 */
export function putAttemptTimeoutMs(bytes: number, concurrency: number): number {
  const sharedUplinkMs = Math.ceil(((bytes * concurrency) / HLS_MIN_UPLINK_BYTES_PER_SECOND) * 1000);

  return Math.max(HLS_PUT_MIN_TIMEOUT_MS, sharedUplinkMs);
}

function putRetryDelayMs(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), HLS_PUT_MAX_RETRY_DELAY_MS);
}

/**
 * Returns a signal that aborts when `callerSignal` aborts or `timeoutMs` passes. Call `dispose` once the request settles.
 */
function startPutAttempt(timeoutMs: number, callerSignal?: AbortSignal): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  const timer = setTimeout(
    () => controller.abort(new DOMException('HLS segment PUT timed out', 'TimeoutError')),
    timeoutMs
  );

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }
  };
}

/**
 * PUTs `body` to a presigned URL, retrying network errors, stalls, 403 (with a fresh presign), 429 and 5xx.
 * Returns the presign that succeeded. Throws the caller's abort reason on cancel, or the last error once attempts run out.
 */
export async function putPresignedObject(options: {
  path: string;
  presigned: PresignedUrl;
  body: Blob;
  contentType: string;
  signal?: AbortSignal;
  getConcurrency: () => number;
  refreshPresign: () => Promise<PresignedUrl>;
  onNetworkFailure: () => void;
  onFailure: (failure: HlsUploadFailureContext) => void;
}): Promise<PresignedUrl> {
  let presigned = options.presigned;

  for (let attempt = 1; attempt <= HLS_PUT_MAX_ATTEMPTS; attempt += 1) {
    const requestStartedAt = Date.now();
    const recordFailure = (
      failure: { httpStatus: number | null; errorName?: string },
      requestDurationMs = Date.now() - requestStartedAt
    ) => {
      options.onFailure({
        objectPath: options.path,
        requestBytes: options.body.size,
        contentType: options.contentType,
        attempt,
        requestDurationMs,
        presignedAgeMs: Date.now() - presigned.createdAt,
        ...failure
      });
    };
    const timeoutMs = putAttemptTimeoutMs(options.body.size, options.getConcurrency());
    const putAttempt = startPutAttempt(timeoutMs, options.signal);
    let response: Response;

    try {
      response = await fetch(presigned.url, {
        method: 'PUT',
        headers: { 'Content-Type': options.contentType },
        body: options.body,
        signal: putAttempt.signal
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;

      options.onNetworkFailure();

      if (attempt === HLS_PUT_MAX_ATTEMPTS) {
        recordFailure({
          httpStatus: null,
          errorName: error instanceof Error ? error.name : typeof error
        });
        throw error;
      }

      await sleep(putRetryDelayMs(attempt), options.signal);
      continue;
    } finally {
      putAttempt.dispose();
    }

    if (response.ok) return presigned;

    const retryable = response.status === 403 || response.status === 429 || response.status >= 500;
    if (!retryable || attempt === HLS_PUT_MAX_ATTEMPTS) {
      recordFailure({ httpStatus: response.status });
      const detail = await response.text().catch(() => '');
      const suffix = detail ? `: ${detail.slice(0, 160)}` : '';
      throw new HlsEncoderError('upload_failed', `PUT ${options.path} → ${response.status}${suffix}`);
    }

    if (response.status === 403) {
      const requestDurationMs = Date.now() - requestStartedAt;
      try {
        presigned = await options.refreshPresign();
      } catch (error) {
        recordFailure({ httpStatus: response.status }, requestDurationMs);
        throw error;
      }
    }

    await sleep(putRetryDelayMs(attempt), options.signal);
  }

  throw new HlsEncoderError('upload_failed', `PUT ${options.path} failed`);
}

/**
 * Runs a conversion, cancelling it when `signal` aborts. Resolves or rejects once `execute` has settled and any
 * cancellation it triggered has finished releasing its resources.
 */
export async function executeCancellableConversion(
  conversion: { execute(): Promise<void>; cancel(): Promise<void> },
  signal?: AbortSignal
): Promise<void> {
  let cancellation: Promise<void> | null = null;
  const cancelConversion = () => {
    cancellation ??= conversion.cancel();
  };

  if (signal?.aborted) {
    cancelConversion();
  } else {
    signal?.addEventListener('abort', cancelConversion, { once: true });
  }

  try {
    await conversion.execute();
  } finally {
    signal?.removeEventListener('abort', cancelConversion);
    await cancellation?.catch(() => undefined);
  }
}
