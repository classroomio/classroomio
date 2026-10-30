import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { automationKeyMiddleware } from './automation-key';
import { AUTOMATION_KEY_PREFIX, oauthTokenMiddleware } from './oauth-token';

export const automationKeyOrOAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized', code: ErrorCodes.UNAUTHORIZED }, 401);
  }

  const credential = authHeader.replace('Bearer ', '').trim();

  if (credential.startsWith(AUTOMATION_KEY_PREFIX)) {
    return automationKeyMiddleware(c, next);
  }

  return oauthTokenMiddleware(c, next);
};
