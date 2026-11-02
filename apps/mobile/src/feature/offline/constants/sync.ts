export const SYNC_DATABASE_NAME = 'offline-sync.db';

export const SYNC_BATCH_SIZE = 100;

export const SYNC_RETRY_BASE_MS = 5_000;

export const SYNC_RETRY_MAX_MS = 15 * 60 * 1000;

/** Synced entries stay visible in the queue panel for this long, then are pruned on launch. */
export const SYNCED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
