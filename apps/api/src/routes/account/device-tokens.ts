import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { registerDeviceToken, unregisterDeviceToken } from '@api/services/notification/device-tokens';
import { zValidator } from '@hono/zod-validator';
import { ZDeviceTokenParam, ZDeviceTokenRegister } from '@cio/utils/validation/notifications';

export const accountDeviceTokensRouter = new Hono()
  /**
   * POST /account/device-tokens
   * Registers or refreshes this device's push token for the signed-in user.
   */
  .post('/device-tokens', authMiddleware, zValidator('json', ZDeviceTokenRegister), async (c) => {
    try {
      const user = c.get('user')!;
      const input = c.req.valid('json');
      const data = await registerDeviceToken(user.id, input);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to register device token');
    }
  })
  /**
   * DELETE /account/device-tokens/:token
   * Removes this device's push token, on sign-out.
   */
  .delete('/device-tokens/:token', authMiddleware, zValidator('param', ZDeviceTokenParam), async (c) => {
    try {
      const user = c.get('user')!;
      const { token } = c.req.valid('param');
      const data = await unregisterDeviceToken(user.id, token);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to remove device token');
    }
  });
