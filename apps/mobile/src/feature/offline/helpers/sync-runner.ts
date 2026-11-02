import type { QueryClient } from '@tanstack/react-query';
import { getNetworkStateAsync } from 'expo-network';

import type { ApiClient } from '@/feature/common/api/api-client';
import { ApiError, request } from '@/feature/common/api/request';
import { SYNC_BATCH_SIZE, SYNC_RETRY_BASE_MS, SYNC_RETRY_MAX_MS } from '@/feature/offline/constants/sync';
import { getSyncEntries, updateSyncStates, type SyncStateUpdate } from '@/feature/offline/helpers/sync-queue';
import type { SyncEntry, SyncResult } from '@/feature/offline/types/sync';

type SyncRunnerContext = { api: ApiClient; queryClient: QueryClient; userId: string };

let context: SyncRunnerContext | null = null;
let running: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function configureSyncRunner(next: SyncRunnerContext | null) {
  context = next;
  if (!next && retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function backoffMs(attempts: number) {
  const exponential = SYNC_RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1);

  return Math.min(SYNC_RETRY_MAX_MS, exponential) + Math.floor(Math.random() * 1000);
}

function isDue(entry: SyncEntry, now: number, force: boolean) {
  if (entry.status === 'queued') return true;
  if (entry.status !== 'failed' || !entry.retryable) return false;

  return force || entry.nextAttemptAt <= now;
}

function retryLater(entry: SyncEntry, error: string): SyncStateUpdate {
  const attempts = entry.attempts + 1;

  return {
    key: entry.key,
    status: 'failed',
    attempts,
    nextAttemptAt: Date.now() + backoffMs(attempts),
    error,
    retryable: true
  };
}

function settle(entry: SyncEntry, result: SyncResult | undefined): SyncStateUpdate {
  if (!result || result.status === 'failed') return retryLater(entry, result?.message ?? 'Not synced yet');

  if (result.status === 'rejected') {
    return {
      key: entry.key,
      status: 'failed',
      attempts: entry.attempts + 1,
      nextAttemptAt: 0,
      error: result.message ?? null,
      retryable: false
    };
  }

  return {
    key: entry.key,
    status: 'synced',
    attempts: entry.attempts + 1,
    nextAttemptAt: 0,
    error: null,
    retryable: true
  };
}

/** Batches for one course, in queue order, so the server replays each course oldest first. */
function batchesOf(due: SyncEntry[]) {
  const byCourse = new Map<string, SyncEntry[]>();
  for (const entry of due) {
    const list = byCourse.get(entry.courseId) ?? [];
    list.push(entry);
    byCourse.set(entry.courseId, list);
  }

  return [...byCourse.values()].flatMap((list) => {
    const batches: SyncEntry[][] = [];
    for (let index = 0; index < list.length; index += SYNC_BATCH_SIZE)
      batches.push(list.slice(index, index + SYNC_BATCH_SIZE));

    return batches;
  });
}

async function sendBatch(api: ApiClient, batch: SyncEntry[]) {
  const courseId = batch[0]!.courseId;
  await updateSyncStates(batch.map((entry) => ({ ...entry, status: 'syncing' as const })));

  try {
    const response = await request(
      api.course[':courseId'].sync.$post({
        param: { courseId },
        json: { intents: batch.map((entry) => entry.payload) }
      })
    );
    const results = new Map(response.data.results.map((result) => [result.key, result]));
    await updateSyncStates(batch.map((entry) => settle(entry, results.get(entry.key))));

    return response.data.results.some((result) => result.status === 'applied' || result.status === 'already_complete');
  } catch (error) {
    const refused = error instanceof ApiError && [400, 403, 404, 422].includes(error.status);
    const message = error instanceof Error ? error.message : 'Sync failed';
    await updateSyncStates(
      batch.map((entry) =>
        refused
          ? {
              key: entry.key,
              status: 'failed' as const,
              attempts: entry.attempts + 1,
              nextAttemptAt: 0,
              error: message,
              retryable: false
            }
          : retryLater(entry, message)
      )
    );

    return false;
  }
}

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;

  const pending = getSyncEntries().filter((entry) => entry.status === 'failed' && entry.retryable);
  if (pending.length === 0) return;

  const nextAt = Math.min(...pending.map((entry) => entry.nextAttemptAt));
  retryTimer = setTimeout(() => void requestSync(), Math.max(1000, nextAt - Date.now()));
}

async function run(force: boolean) {
  const active = context;
  if (!active) return false;

  const network = await getNetworkStateAsync().catch(() => null);
  if (network?.isConnected === false || network?.isInternetReachable === false) return false;

  const due = getSyncEntries().filter((entry) => entry.userId === active.userId && isDue(entry, Date.now(), force));
  let changed = false;
  for (const batch of batchesOf(due)) {
    if (context !== active) return false;

    changed = (await sendBatch(active.api, batch)) || changed;
  }

  if (changed) {
    await Promise.all([
      active.queryClient.invalidateQueries({ queryKey: ['courses'] }),
      active.queryClient.invalidateQueries({ queryKey: ['lessons'] }),
      active.queryClient.invalidateQueries({ queryKey: ['account'] })
    ]);
  }

  scheduleRetry();

  return due.length > 0;
}

/**
 * Replays the queue oldest first. Concurrent calls share one run; `force` also retries entries still waiting out
 * their backoff, which is what "Sync now" does.
 */
export function requestSync(options: { force?: boolean } = {}) {
  if (running) return running;

  running = run(options.force ?? false)
    .catch(() => false)
    .then((processed) => {
      running = null;
      if (processed && getSyncEntries().some((entry) => entry.status === 'queued')) void requestSync();
    });

  return running;
}

/** Puts refused entries back in the queue for one more attempt. */
export async function retrySyncEntry(entry: SyncEntry) {
  await updateSyncStates([
    { key: entry.key, status: 'queued', attempts: entry.attempts, nextAttemptAt: 0, error: null, retryable: true }
  ]);

  return requestSync();
}
