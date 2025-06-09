import { Context, Next } from 'hono';

import { validateUser } from '$src/utils/auth/validate-user';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('authorization');

    if (!authHeader) {
      return c.json(
        {
          success: false,
          message: 'No authorization header provided'
        },
        401
      );
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return c.json(
        {
          success: false,
          message: 'Invalid authorization header format'
        },
        401
      );
    }

    const user = await validateUser(token);
    c.set('user', user); // Attach the user to the context
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
