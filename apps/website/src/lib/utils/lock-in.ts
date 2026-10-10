import { dev } from '$app/environment';

const LOCK_IN_URL = dev ? 'http://localhost:5173/api/polar/lock-in' : 'https://app.classroomio.com/api/polar/lock-in';

export type LockInInterval = 'month' | 'year';

export function getLockInHref(interval: LockInInterval): string {
  return `${LOCK_IN_URL}?interval=${interval}`;
}
