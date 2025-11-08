import { Context, Next } from 'hono';

import { auth } from '@cio/db/auth';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set('user', null);
      c.set('session', null);
      throw new Error('Unauthorized');
    }

    c.set('user', session.user);
    c.set('session', session.session);

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
