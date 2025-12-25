import { Context, Next } from 'hono';

export const authMiddleware = async (c: Context, next: Next) => {
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
