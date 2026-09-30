/**
 * Bounded parallel fan-out for post-commit side effects (emails, audits).
 * Each item runs independently; per-item failures must be handled inside
 * `fn` so one bad recipient never rejects the batch.
 *
 * Keep transaction-internal work sequential — parallel queries on a single
 * Drizzle tx client can fail. Use this only outside transactions.
 */
export const EMAIL_FANOUT_CONCURRENCY = 5;

export async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  let nextIndex = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      await fn(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
}
