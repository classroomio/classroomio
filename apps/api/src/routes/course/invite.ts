import {
  ZCourseInviteAuditParam,
  ZCourseInviteParam,
  ZCourseInviteRevokeParam,
  ZCreateCourseInvite
} from '@cio/utils/validation/course/invite';
import { ZToggleInviteLink } from '@cio/utils/validation/invite-link';
import {
  createStudentInvite,
  getStudentInviteAuditTrail,
  listStudentInvites,
  revokeStudentInvite
} from '@api/services/course/invite';
import {
  fetchInviteLinkForResource,
  getOrCreateInviteLinkForResource,
  toggleInviteLinkForResource
} from '@api/services/invite-link';

import { Hono } from '@api/utils/hono';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { courseTeamMemberOrAutomationKeyMiddleware } from '@api/middlewares/course-team-member-or-automation-key';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { extractClientIp } from '@api/utils/redis/key-generators';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

/** Capped per actor: invite creation mints tokens and fans out emails. */
const createInviteRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 60,
  message: 'Too many invite creation attempts. Please try again later.',
  keyGenerator: (c) => {
    const user = c.get('user');
    const automationKey = c.get('automationKey');
    const actor = user?.id
      ? `user:${user.id}`
      : automationKey
        ? `key:${automationKey.id}`
        : `ip:${extractClientIp(c)}`;
    return `course_invite_create:${actor}:${c.req.param('courseId')}`;
  }
});

export const invitesRouter = new Hono()
  /**
   * GET /course/:courseId/invites
   * Lists secure invites for a course (team/admin only)
   */
  .get(
    '/',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:read']),
    zValidator('param', ZCourseInviteParam),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const invites = await listStudentInvites(courseId);

        return c.json(
          {
            success: true,
            data: invites
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to list invites');
      }
    }
  )
  /**
   * POST /course/:courseId/invites
   * Creates a secure student invite token for a course (team/admin only)
   */
  .post(
    '/',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:write']),
    createInviteRateLimit,
    zValidator('param', ZCourseInviteParam),
    zValidator('json', ZCreateCourseInvite),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const { courseId } = c.req.valid('param');
        const payload = c.req.valid('json');

        const invite = await createStudentInvite(courseId, actorId, payload);

        return c.json(
          {
            success: true,
            data: invite
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create invite');
      }
    }
  )
  /**
   * GET /course/:courseId/invites/link
   * Returns the course's shareable join link, or null if one was never created.
   */
  .get(
    '/link',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:read']),
    zValidator('param', ZCourseInviteParam),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const invite = await fetchInviteLinkForResource('COURSE', courseId);

        return c.json({ success: true, data: invite }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load course invite link');
      }
    }
  )
  /**
   * POST /course/:courseId/invites/link
   * Returns the course's shareable join link, creating it on first call.
   */
  .post(
    '/link',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:write']),
    createInviteRateLimit,
    zValidator('param', ZCourseInviteParam),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const { courseId } = c.req.valid('param');
        const invite = await getOrCreateInviteLinkForResource('COURSE', courseId, actorId);

        return c.json({ success: true, data: invite }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to create course invite link');
      }
    }
  )
  /**
   * PATCH /course/:courseId/invites/link
   * Disables or re-enables the course's shareable join link.
   */
  .patch(
    '/link',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:write']),
    zValidator('param', ZCourseInviteParam),
    zValidator('json', ZToggleInviteLink),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const { courseId } = c.req.valid('param');
        const { isRevoked } = c.req.valid('json');
        const invite = await toggleInviteLinkForResource('COURSE', courseId, isRevoked, actorId);

        return c.json({ success: true, data: invite }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update course invite link');
      }
    }
  )
  /**
   * POST /course/:courseId/invites/:inviteId/revoke
   * Revokes a secure invite (team/admin only)
   */
  .post(
    '/:inviteId/revoke',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:write']),
    zValidator('param', ZCourseInviteRevokeParam),
    async (c) => {
      try {
        const { courseId, inviteId } = c.req.valid('param');
        const actorId = c.get('actorId')!;
        const revoked = await revokeStudentInvite(courseId, inviteId, actorId);

        return c.json(
          {
            success: true,
            data: revoked
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to revoke invite');
      }
    }
  )
  /**
   * GET /course/:courseId/invites/:inviteId/audit
   * Lists audit trail for an invite (team/admin only)
   */
  .get(
    '/:inviteId/audit',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:invite:read']),
    zValidator('param', ZCourseInviteAuditParam),
    async (c) => {
      try {
        const { courseId, inviteId } = c.req.valid('param');
        const audit = await getStudentInviteAuditTrail(courseId, inviteId);

        return c.json(
          {
            success: true,
            data: audit
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to load invite audit');
      }
    }
  );
