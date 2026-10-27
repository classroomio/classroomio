import { randomBytes, timingSafeEqual } from 'crypto';

export const INTERNAL_REQUEST_HEADER = 'x-cio-internal-request';

const INTERNAL_REQUEST_SECRET = randomBytes(32).toString('hex');

/**
 * Marks a request as dispatched by this process itself. The secret is regenerated on every boot and never leaves the process.
 */
export function markInternalRequest(headers: Headers): void {
  headers.set(INTERNAL_REQUEST_HEADER, INTERNAL_REQUEST_SECRET);
}

export function isInternalRequest(headers: Headers): boolean {
  const presented = Buffer.from(headers.get(INTERNAL_REQUEST_HEADER) ?? '');
  const expected = Buffer.from(INTERNAL_REQUEST_SECRET);

  return presented.length === expected.length && timingSafeEqual(presented, expected);
}
