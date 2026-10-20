import { Context, Next } from 'hono';

import type { ApiErrorResponse } from '@api/utils/errors';

export const authMiddleware = async (c: Context, next: Next): Promise<void | ApiErrorResponse> => {
  try {
    if (!c.get('user') || !c.get('session')) {
      throw new Error('Unauthorized');
    }

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized'
      },
      401
    );
  }
};
