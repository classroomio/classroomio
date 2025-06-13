import { MiddlewareHandler } from 'hono';
import { verify } from 'jsonwebtoken';

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return c.json({ message: 'No token provided' }, 401);
  }

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = verify(token, secret);
    c.set('user', decoded);
    await next();
  } catch (err) {
    return c.json({ message: 'Invalid or expired token' }, 403);
  }
};
