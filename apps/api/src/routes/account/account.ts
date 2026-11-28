import {
  createSelfLoginLinkToken,
  getAccountData,
  listPendingInvitationsForAccount,
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

      const updatedProfile = await updateUser(user.id, validatedData, {
        kind: 'self',
        orgId: c.req.header('cio-org-id')
      });

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
  .post('/login-link-token', authMiddleware, async (c) => {
    const user = c.get('user')!;

    try {
      const token = await createSelfLoginLinkToken({ id: user.id, email: user.email });

      return c.json(
        {
          success: true,
          data: { token }
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create login link token');
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
  })
  /**
   * GET /account/invitations
   * Pending invitations grouped by organization: at most one live org invitation
   * plus live course invitations and cohort access, deduped per course.
   */
  .get('/invitations', authMiddleware, pendingInvitesRateLimit, async (c) => {
    const user = c.get('user')!;

    try {
      const invitations = await listPendingInvitationsForAccount(user);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data: invitations }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load pending invitations');
    }
  })
  /**
   * GET /account/course-invites
   * Student course invites awaiting this account, across all organizations.
   * Kept as a thin alias of /account/invitations for one release; prefer it.
   */
  .get('/course-invites', authMiddleware, pendingInvitesRateLimit, async (c) => {
    const user = c.get('user')!;

    try {
      const invitations = await listPendingInvitationsForAccount(user);

      const invites = invitations.flatMap((group) =>
        group.courses
          .filter((course) => course.inviteId)
          .map((course) => ({
            id: course.inviteId!,
            createdAt: course.createdAt,
            expiresAt: course.expiresAt,
            course: {
              id: course.courseId,
              title: course.title,
              description: course.description,
              slug: course.slug
            },
            organization: group.organization
          }))
      );

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data: invites }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load pending course invites');
    }
  });
