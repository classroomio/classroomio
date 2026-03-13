import { Context, Next } from 'hono';

import { authMiddleware } from './auth';
import { automationKeyMiddleware } from './automation-key';

export const authOrAutomationKeyMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');
  const session = c.get('session');

  if (user && session) {
    c.set('automationKey', null);
    await authMiddleware(c, next);
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return automationKeyMiddleware(c, next);
  }

  return c.json(
    {
      success: false,
      message: 'Unauthorized: Authentication required (session or automation key)'
    },
    401
  );
};
