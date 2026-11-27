import type { Context } from 'hono';

import { ErrorCodes } from '@api/utils/errors';

/** Answers 400 VALIDATION_ERROR naming the id that is malformed, e.g. "Invalid course ID". */
export const invalidIdResponse = (c: Context, label: string) =>
  c.json({ success: false, error: `Invalid ${label} ID`, code: ErrorCodes.VALIDATION_ERROR }, 400);
