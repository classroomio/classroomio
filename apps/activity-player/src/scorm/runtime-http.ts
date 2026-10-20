import type { Scorm12API } from 'scorm-again/scorm12';

type AdapterSettings = NonNullable<ConstructorParameters<typeof Scorm12API>[0]>;

export type RuntimeHttpService = NonNullable<AdapterSettings['httpService']>;

type CommitResult = ReturnType<RuntimeHttpService['processHttpRequest']>;

type CommitParams = Parameters<RuntimeHttpService['processHttpRequest']>[1];

export interface RuntimeHttpHooks {
  onCompleted?: () => void;
  onProgress?: () => void;
  isPageUnloading?: () => boolean;
  initialCmi?: unknown;
}

const BEACON_CONTENT_TYPE = 'text/plain;charset=UTF-8';
const COMMIT_FAILED = 101;

let pageUnloading = false;

function cloneCmi<T>(value: T): T {
  if (value === undefined || value === null) return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns the parts of `current` that differ from `baseline`, keeping the
 * nesting so the server merges them over its stored copy. Returns undefined
 * when nothing changed. Arrays are compared and sent whole.
 */
export function diffCmi(current: unknown, baseline: unknown): unknown {
  if (isPlainObject(current)) {
    if (!isPlainObject(baseline)) return current;

    const changed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(current)) {
      const delta = diffCmi(value, baseline[key]);

      if (delta !== undefined) changed[key] = delta;
    }

    return Object.keys(changed).length > 0 ? changed : undefined;
  }

  if (Array.isArray(current)) {
    return JSON.stringify(current) === JSON.stringify(baseline) ? undefined : current;
  }

  return Object.is(current, baseline) ? undefined : current;
}

/**
 * Remembers when the player page starts to unload, so exit saves switch to
 * beacon delivery. Call once at boot, before any module session starts.
 */
export function watchPageUnload(): () => void {
  const markUnloading = () => {
    pageUnloading = true;
  };
  const markShown = (event: PageTransitionEvent) => {
    if (event.persisted) pageUnloading = false;
  };

  window.addEventListener('pagehide', markUnloading);
  window.addEventListener('pageshow', markShown);

  return () => {
    window.removeEventListener('pagehide', markUnloading);
    window.removeEventListener('pageshow', markShown);
  };
}

export function isPageUnloading(): boolean {
  return pageUnloading;
}

/**
 * Reads a commit response: maps it to a SCORM result and reports completion
 * or progress changes to the embedder.
 */
export function readCommitResponse(
  status: number,
  responseText: string,
  hooks: Pick<RuntimeHttpHooks, 'onCompleted' | 'onProgress'> = {}
): { result: string | boolean; errorCode: number } {
  if (status < 200 || status > 299) {
    return { result: false, errorCode: COMMIT_FAILED };
  }

  let parsed: unknown = null;

  try {
    parsed = JSON.parse(responseText) as unknown;
  } catch {
    parsed = null;
  }

  if (!isPlainObject(parsed) || !('result' in parsed)) {
    return { result: true, errorCode: 0 };
  }

  if (parsed['completedActivity'] === true) hooks.onCompleted?.();
  else if (parsed['progressChanged'] === true) hooks.onProgress?.();

  const result = parsed['result'] as string | boolean;
  const succeeded = result === true || result === 'true';
  const errorCode = typeof parsed['errorCode'] === 'number' ? parsed['errorCode'] : succeeded ? 0 : COMMIT_FAILED;

  return { result, errorCode };
}

function isSuccess(result: CommitResult): boolean {
  return result.result === true || result.result === 'true';
}

function sendBeacon(url: string, body: string): CommitResult {
  const delivered =
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon(url, new Blob([body], { type: BEACON_CONTENT_TYPE }));

  return delivered ? { result: true, errorCode: 0 } : { result: false, errorCode: COMMIT_FAILED };
}

async function sendAsynchronously(
  url: string,
  buildBody: () => string,
  hooks: RuntimeHttpHooks,
  onAcknowledged?: () => void
): Promise<void> {
  if (typeof fetch === 'function') {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildBody()
    })
      .then(async (response) => {
        const text = await response.text();
        const result = readCommitResponse(response.status, text, hooks);
        if (isSuccess(result)) onAcknowledged?.();
      })
      .catch(() => {});

    return;
  }

  await new Promise<void>((resolve) => {
    const request = new XMLHttpRequest();

    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = () => {
      const result = readCommitResponse(request.status, request.responseText, hooks);
      if (isSuccess(result)) onAcknowledged?.();
      resolve();
    };
    request.onerror = () => resolve();

    try {
      request.send(buildBody());
    } catch {
      resolve();
    }
  });
}

function sendSynchronously(url: string, body: string, hooks: RuntimeHttpHooks): CommitResult | null {
  const request = new XMLHttpRequest();

  try {
    request.open('POST', url, false);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(body);
  } catch {
    return null;
  }

  return readCommitResponse(request.status, request.responseText, hooks);
}

/**
 * Sends one module's saves to the run-time API. Each save carries only what
 * changed since the last save the server accepted. Saves, including the exit
 * save, go out as synchronous requests so the result reaches the package and
 * the embedder; once the page is unloading they go out as beacons instead.
 */
export function createRuntimeHttpService(hooks: RuntimeHttpHooks = {}): RuntimeHttpService {
  const unloading = hooks.isPageUnloading ?? isPageUnloading;
  let acknowledged: unknown = hooks.initialCmi !== undefined ? cloneCmi(hooks.initialCmi) : undefined;
  let acknowledgedSequence = -1;
  let saveQueue: Promise<void> = Promise.resolve();

  const acknowledge = (cmi: unknown, sequence: unknown): void => {
    const numericSequence = typeof sequence === 'number' ? sequence : Number(sequence);

    if (Number.isFinite(numericSequence)) {
      if (numericSequence < acknowledgedSequence) return;

      acknowledgedSequence = numericSequence;
    }

    acknowledged = cloneCmi(cmi);
  };

  return {
    processHttpRequest(url: string, params: CommitParams, immediate: boolean): CommitResult {
      const fields: unknown = params;

      if (!isPlainObject(fields)) {
        return { result: false, errorCode: COMMIT_FAILED };
      }

      const fullCmi = fields['cmi'];
      const changedCmi = diffCmi(fullCmi, acknowledged) ?? {};
      const body = JSON.stringify({ ...fields, cmi: changedCmi });
      const isExit = immediate || fields['terminate'] === true;

      if (!isExit) {
        const commitSequence = fields['commitSequence'];
        const pending: Record<string, unknown> = { ...fields, cmi: cloneCmi(fullCmi) };

        saveQueue = saveQueue
          .then(() =>
            sendAsynchronously(
              url,
              () => {
                const pendingChanges = diffCmi(pending.cmi, acknowledged) ?? {};
                return JSON.stringify({ ...pending, cmi: pendingChanges });
              },
              hooks,
              () => acknowledge(pending.cmi, commitSequence)
            )
          )
          .catch(() => {});

        return { result: true, errorCode: 0 };
      }

      if (unloading()) {
        return sendBeacon(url, body);
      }

      const result = sendSynchronously(url, body, hooks);

      // Browsers refuse synchronous requests while a document is being dismissed.
      if (result === null) {
        return sendBeacon(url, body);
      }

      if (isSuccess(result)) acknowledge(fullCmi, fields['commitSequence']);

      return result;
    },
    updateSettings() {}
  };
}
