import { ZCourseInviteTokenParam } from '@cio/utils/validation/course/invite';
import { previewStudentInvite } from '@api/services/course/invite';
import { ZOrganizationInviteTokenParam } from '@cio/utils/validation/organization/invite';
import { acceptOrganizationInvite, previewOrganizationInvite } from '@api/services/organization/invite';

import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { authMiddleware } from '@api/middlewares/auth';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { handleError } from '@api/utils/errors';
import { extractClientIp } from '@api/utils/redis/key-generators';
import { zValidator } from '@hono/zod-validator';

const previewInviteRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many invite preview requests. Please try again later.',
  keyGenerator: (c) => `invite_preview:${extractClientIp(c)}:${c.req.param('token')}`
});

const previewOrganizationInviteRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many organization invite preview requests. Please try again later.',
  keyGenerator: (c) => `org_invite_preview:${extractClientIp(c)}:${c.req.param('token')}`
});

const acceptOrganizationInviteRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many organization invite join attempts. Please try again later.',
  keyGenerator: (c) => {
    const user = c.get('user');
    const actor = user?.id ? `user:${user.id}` : `ip:${extractClientIp(c)}`;
    return `org_invite_accept:${actor}:${c.req.param('token')}`;
  }
});

export const inviteRouter = new Hono()
  /**
   * GET /invite/student/:token
   * Server-only preview for secure invite links (API key). Returns course, org, invite for enroll page.
   */
  .get(
    '/student/:token',
    apiKeyMiddleware,
    previewInviteRateLimit,
    zValidator('param', ZCourseInviteTokenParam),
    async (c) => {
      try {
        const { token } = c.req.valid('param');

        const preview = await previewStudentInvite(token, {
          ipAddress: extractClientIp(c),
          userAgent: c.req.header('user-agent') || null
        });
        return c.json(
          {
            success: true,
            data: preview
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to load invite');
      }
    }
  )
  /**
   * GET /invite/organization/:token/preview
   * Server-only preview for organization role invites (API key)
   */
  .get(
    '/organization/:token/preview',
    apiKeyMiddleware,
    previewOrganizationInviteRateLimit,
    zValidator('param', ZOrganizationInviteTokenParam),
    async (c) => {
      try {
        const { token } = c.req.valid('param');
        const preview = await previewOrganizationInvite(token, {
          ipAddress: extractClientIp(c),
          userAgent: c.req.header('user-agent') || null
        });

        return c.json(
          {
            success: true,
            data: preview
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to load organization invite');
      }
    }
  )
  /**
   * POST /invite/organization/:token/accept
   * Authenticated organization role invite acceptance
   */
  .post(
    '/organization/:token/accept',
    authMiddleware,
    acceptOrganizationInviteRateLimit,
    zValidator('param', ZOrganizationInviteTokenParam),
    async (c) => {
      try {
        const { token } = c.req.valid('param');
        const user = c.get('user')!;
        const result = await acceptOrganizationInvite(
          token,
          {
            id: user.id,
            email: user.email
          },
          {
            ipAddress: extractClientIp(c),
            userAgent: c.req.header('user-agent') || null
          }
        );

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to accept organization invite');
      }
    }
  );
