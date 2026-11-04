/**
 * Resolves or rejects like `promise`, but never before `minimumMs` have passed since the call.
 */
export async function settleNoSoonerThan<T>(promise: Promise<T>, minimumMs: number): Promise<T> {
  const delay = new Promise((resolve) => setTimeout(resolve, minimumMs));
  const [outcome] = await Promise.allSettled([promise, delay]);

  if (outcome.status === 'rejected') throw outcome.reason;

  return outcome.value;
}
