import { clearUserDownloads } from '@/feature/downloads/helpers/download-manager';
import { clearSyncQueue } from '@/feature/offline/helpers/sync-queue';
import { requestSync } from '@/feature/offline/helpers/sync-runner';

const FINAL_SYNC_TIMEOUT_MS = 4000;

/**
 * Gives queued progress one last chance to sync, then removes the user's downloaded files, download records and sync
 * queue from this device. Call it before the session ends so the final sync can still authenticate.
 */
export async function clearOfflineData(userId: string | null) {
  if (!userId) return;

  await Promise.race([
    requestSync({ force: true }),
    new Promise((resolve) => setTimeout(resolve, FINAL_SYNC_TIMEOUT_MS))
  ]);
  await Promise.all([clearUserDownloads(userId).catch(() => {}), clearSyncQueue(userId).catch(() => {})]);
}
