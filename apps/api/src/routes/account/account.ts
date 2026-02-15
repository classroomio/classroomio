import { getAccountData, updateUser } from '@api/services/account';

import { Hono } from '@api/utils/hono';
import { ZUpdateProfile } from '@cio/utils/validation/account';
import { authMiddleware } from '@api/middlewares/auth';
import { getProfileById } from '@cio/db/queries/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const accountRouter = new Hono()
  .get('/', authMiddleware, async (c) => {
    const user = c.get('user')!;

    try {
      console.time('accountRouter');
      const accountData = await getAccountData(user.id);
      console.timeEnd('accountRouter');

      return c.json(
        {
          success: true,
          user,
          profile: accountData.profile,
          organizations: accountData.organizations
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch account data');
    }
  })
  .put('/profile', authMiddleware, zValidator('json', ZUpdateProfile), async (c) => {
    const user = c.get('user')!;

    try {
      const validatedData = c.req.valid('json');

      const updatedProfile = await updateUser(user.id, validatedData);

      return c.json(
        {
          success: true,
          profile: updatedProfile
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to update profile');
    }
  })
  .get('/profile', authMiddleware, async (c) => {
    const user = c.get('user')!;

    try {
      const profile = await getProfileById(user.id);

      if (!profile) {
        return c.json(
          {
            success: false,
            error: 'Profile not found'
          },
          404
        );
      }

      return c.json(
        {
          success: true,
          profile
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch profile');
    }
  });
