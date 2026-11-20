/**
 * Bounded parallel fan-out for post-commit side effects (emails, audits).
 * Each item runs independently; per-item failures must be handled inside
 * `fn` so one bad recipient never rejects the batch.
 *
 * Keep transaction-internal work sequential — parallel queries on a single
 * Drizzle tx client can fail. Use this only outside transactions.
 */
export const EMAIL_FANOUT_CONCURRENCY = 5;

/**
 * Runs `fn` over items with at most `limit` in flight and resolves with the
 * results in input order once all settle.
 */
export async function mapWithConcurrency<T, R = void>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  const workerCount = Math.max(1, Math.min(limit, items.length));
  let nextIndex = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);

  return results;
}
