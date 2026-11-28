import { z } from 'zod';

// Postgres accepts any 8-4-4-4-12 hex id; z.uuid() also demands RFC version bits and would refuse ids the database holds.
export const ZUuid = z.guid();

/** True when `value` is a string Postgres accepts as a uuid. */
export function isValidUuid(value: unknown): value is string {
  return ZUuid.safeParse(value).success;
}

/** True when `value` is a positive integer string that survives `Number()`, so it is safe for a bigint column. */
export function isValidNumericId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}
