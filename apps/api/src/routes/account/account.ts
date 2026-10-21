import {
  createViewAsStudentToken,
  getAccountData,
  listPendingInvitesForAccount,
  updateUser
} from '@api/services/account';

import { Hono } from '@api/utils/hono';
import { ZUpdateProfile } from '@cio/utils/validation/account';
import { accountWorkspacesRouter } from '@api/routes/account/workspaces';
import { authMiddleware } from '@api/middlewares/auth';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { extractClientIp } from '@api/utils/redis/key-generators';
import { getProfileById } from '@cio/db/queries/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

const pendingInvitesRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many pending invite requests. Please try again later.',
  keyGenerator: (c) => {
    const user = c.get('user');
    return `account_invites:${user?.id ?? extractClientIp(c)}`;
  }
});

export const accountRouter = new Hono()
  .route('/', accountWorkspacesRouter)
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
          organizations: accountData.organizations,
          licenseFeatures: accountData.licenseFeatures
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
  .post('/view-as-student-token', authMiddleware, async (c) => {
    const user = c.get('user')!;

    try {
      // Self sign-in only — mints a login-link token for the current user so they
      // can be auto-authenticated on the org domain to preview the student experience.
      const token = await createViewAsStudentToken({ id: user.id, email: user.email });

      return c.json(
        {
          success: true,
          data: { token }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create view-as-student token');
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
  })
  /**
   * GET /account/invites
   * Every pending organization invite awaiting this account, across all organizations.
   */
  .get('/invites', authMiddleware, pendingInvitesRateLimit, async (c) => {
    const user = c.get('user')!;

    try {
      if (!user.email) {
        return c.json({ success: true, data: [] }, 200);
      }

      const invites = await listPendingInvitesForAccount(user.email);

      // Account-scoped data: keep it out of the shared browser cache so it cannot be
      // replayed after a different user signs in to the same profile.
      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data: invites }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load pending invites');
    }
  });
