import {
  ZAddLearningPathCourse,
  ZAddLearningPathMembers,
  ZCreateLearningPath,
  ZEnrollInLearningPath,
  ZGetLearningPathsQuery,
  ZLearningPathCertificateDownloadRequest,
  ZLearningPathCourseParam,
  ZLearningPathIdParam,
  ZLearningPathMemberParam,
  ZPathMembersQuery,
  ZPublicLearningPathQuery,
  ZPublicLearningPathsQuery,
  ZReorderLearningPathCourses,
  ZUpdateLearningPath,
  ZUpdateLearningPathMemberRole,
  ZVerifyLearningPathCertificateParam
} from '@cio/utils/validation/learning-path';
import { ZToggleInviteLink } from '@cio/utils/validation/invite-link';

import type { TLearningPathCertificateDownloadRequest } from '@cio/utils/validation/learning-path';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

import {
  addCoursesToPathService,
  addPathMembersService,
  assertLearningPathCertificateDownloadAllowed,
  assertLearningPathCertificatePreviewAllowed,
  assembleLearningPathCertificateRender,
  assembleLearningPathOwnerPreviewRender,
  createLearningPathService,
  deleteLearningPathService,
  enrollInLearningPath,
  getBulkPathEnrollmentStatus,
  getLearningPathDetail,
  getPathAnalyticsService,
  getPathJourneyService,
  getPathMemberDetailService,
  getPublicLearningPathBySlug,
  listPublicLearningPathsService,
  listOrgLearningPaths,
  listPathMembersService,
  removeCourseFromPathService,
  removePathMemberService,
  reorderPathCoursesService,
  updateLearningPathService,
  updatePathMemberRoleService,
  verifyLearningPathCertificateService
} from '@api/services/learning-path';
import { generateCertificatePdf, generateCertificatePng, sendCertificateFile } from '@api/utils/certificate';
import {
  fetchInviteLinkForResource,
  getOrCreateInviteLinkForResource,
  toggleInviteLinkForResource
} from '@api/services/invite-link';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { learningPathTeamOrAutomationKeyMiddleware } from '@api/middlewares/learning-path-team-or-automation-key';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { learningPathMemberMiddleware } from '@api/middlewares/learning-path-member';
import { learningPathTeamMiddleware } from '@api/middlewares/learning-path-team';
import { extractClientIp } from '@api/utils/redis/key-generators';
import { sanitizeHtml } from '@cio/core/utils/sanitize-html';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const ZPathParam = ZLearningPathIdParam;
const ZCourseParam = ZLearningPathCourseParam;
const ZMemberParam = ZLearningPathMemberParam;
const ZPersonParam = z.object({ pathId: z.string().min(1), personId: z.string().uuid() });

const ZSlugParam = z.object({ slug: z.string().min(1) });
const ZBulkStatusParam = z.object({ pathId: z.string().min(1), jobId: z.string().min(1) });
const ZBulkStatusQuery = z.object({ pollCount: z.coerce.number().int().min(0).default(0) });

function getOrgRoles(c: { get: (key: string) => unknown }): Record<string, number> | undefined {
  return c.get('orgRoles') as Record<string, number> | undefined;
}

const enrollRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many enrollment attempts. Please try again later.',
  keyGenerator: (c) => {
    const user = c.get('user');
    const actor = user?.id ? `user:${user.id}` : `ip:${extractClientIp(c)}`;
    return `lp-enroll:${actor}:${c.req.param('pathId')}`;
  }
});

async function loadLearningPathCertificateInput(
  pathId: string,
  userId: string,
  body: TLearningPathCertificateDownloadRequest,
  orgRoles?: Record<string, number>
) {
  if (body.previewMode) {
    await assertLearningPathCertificatePreviewAllowed(pathId, userId, orgRoles);

    return assembleLearningPathOwnerPreviewRender(pathId, userId, body);
  }

  const issued = await assertLearningPathCertificateDownloadAllowed(pathId, userId);

  return assembleLearningPathCertificateRender(pathId, userId, body, issued);
}

export const learningPathRouter = new Hono()
  /**
   * GET /learning-path/public?organizationId=...
   * Public catalog route for learning paths (unauthenticated, published only)
   */
  .get('/public', zValidator('query', ZPublicLearningPathsQuery), async (c) => {
    try {
      const query = c.req.valid('query');
      const result = await listPublicLearningPathsService(query.organizationId, query);

      return c.json({ success: true, data: result.data, pagination: result.pagination }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list public learning paths');
    }
  })
  /**
   * GET /learning-path/public/:slug?organizationId=...
   * Public landing route for learning paths (unauthenticated)
   */
  .get('/public/:slug', zValidator('param', ZSlugParam), zValidator('query', ZPublicLearningPathQuery), async (c) => {
    try {
      const { slug } = c.req.valid('param');
      const { organizationId } = c.req.valid('query');
      const path = await getPublicLearningPathBySlug(organizationId, slug);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch public learning path');
    }
  })

  /**
   * GET /learning-path/certificates/:certificateId/verify
   * Public certificate verification endpoint (unauthenticated)
   */
  .get('/certificates/:certificateId/verify', zValidator('param', ZVerifyLearningPathCertificateParam), async (c) => {
    try {
      const { certificateId } = c.req.valid('param');
      const certificate = await verifyLearningPathCertificateService(certificateId);

      return c.json({ success: true, data: certificate }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to verify learning path certificate');
    }
  })
  /**
   * GET /learning-path?organizationId=...
   * Lists learning paths for an organization (paginated)
   */
  .get(
    '/',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:read'], { team: false }),
    zValidator('query', ZGetLearningPathsQuery),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { organizationId, page, limit, search } = c.req.valid('query');
        // Org-scoped automation keys resolve the organization server-side.
        const effectiveOrgId = automationKey ? c.get('orgId')! : organizationId;

        if (!effectiveOrgId) {
          return c.json({ success: false, error: 'Organization ID is required' }, 400);
        }

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'list_learning_paths');
        }

        const result = await listOrgLearningPaths(effectiveOrgId, actorId, orgRoles, { page, limit, search });

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'list_learning_paths', { organizationId: effectiveOrgId });
        }

        return c.json({ success: true, data: result.data, pagination: result.pagination }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list learning paths');
      }
    }
  )

  /**
   * POST /learning-path
   * Creates a new learning path in UNPUBLISHED status
   */
  .post(
    '/',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:write'], { team: false }),
    zValidator('json', ZCreateLearningPath),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { organizationId, ...data } = c.req.valid('json');
        // Org-scoped automation keys resolve the organization server-side.
        const effectiveOrgId = automationKey ? c.get('orgId')! : organizationId;

        if (!effectiveOrgId) {
          return c.json({ success: false, error: 'Organization ID is required' }, 400);
        }

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'create_learning_path');
        }

        const path = await createLearningPathService(effectiveOrgId, actorId, data, orgRoles);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'create_learning_path', { pathId: path.id });
        }

        return c.json({ success: true, data: path }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create learning path');
      }
    }
  )

  /**
   * GET /learning-path/:pathId
   * Gets detail of a learning path including its ordered courses
   */
  .get(
    '/:pathId',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:read']),
    zValidator('param', ZPathParam),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'get_learning_path_detail');
        }

        const path = await getLearningPathDetail(pathId, actorId, orgRoles);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'get_learning_path_detail', { pathId });
        }

        return c.json({ success: true, data: path }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get learning path detail');
      }
    }
  )

  /**
   * PUT /learning-path/:pathId
   * Updates a learning path
   */
  .put(
    '/:pathId',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']),
    zValidator('param', ZPathParam),
    zValidator('json', ZUpdateLearningPath),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const rawData = c.req.valid('json');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'update_learning_path_landing_page');
        }

        let data = rawData;
        if (rawData.welcomeEmailMessage) {
          data = { ...data, welcomeEmailMessage: sanitizeHtml(rawData.welcomeEmailMessage) };
        }
        if (rawData.certificate?.emailMessage) {
          data = {
            ...data,
            certificate: {
              ...data.certificate,
              emailMessage: sanitizeHtml(rawData.certificate.emailMessage)
            }
          };
        }

        const path = await updateLearningPathService(pathId, actorId, data, orgRoles);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'update_learning_path_landing_page', { pathId });
        }

        return c.json({ success: true, data: path }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update learning path');
      }
    }
  )

  /**
   * DELETE /learning-path/:pathId
   * Deletes a learning path
   */
  .delete('/:pathId', authMiddleware, learningPathTeamMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      c.get('user')!;
      const orgRoles = getOrgRoles(c);
      const { pathId } = c.req.valid('param');
      const path = await deleteLearningPathService(pathId, orgRoles);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete learning path');
    }
  })

  /**
   * POST /learning-path/:pathId/enroll
   * Self-enrolls the caller in a published learning path and its courses (idempotent)
   */
  .post(
    '/:pathId/enroll',
    authMiddleware,
    enrollRateLimit,
    zValidator('param', ZPathParam),
    zValidator('json', ZEnrollInLearningPath),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { pathId } = c.req.valid('param');
        c.req.valid('json');
        const member = await enrollInLearningPath(pathId, user.id);

        return c.json({ success: true, data: member }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to enroll in learning path');
      }
    }
  )

  /**
   * POST /learning-path/:pathId/courses
   * Adds courses to a learning path (and auto-enrolls members atomically)
   */
  .post(
    '/:pathId/courses',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']),
    zValidator('param', ZPathParam),
    zValidator('json', ZAddLearningPathCourse),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'add_courses_to_learning_path');
        }

        const courses = await addCoursesToPathService(pathId, data, actorId, orgRoles);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'add_courses_to_learning_path', { pathId });
        }

        return c.json({ success: true, data: courses }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to add course to learning path');
      }
    }
  )

  /**
   * PUT /learning-path/:pathId/courses/order
   * Reorders courses in a learning path atomically
   */
  .put(
    '/:pathId/courses/order',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']),
    zValidator('param', ZPathParam),
    zValidator('json', ZReorderLearningPathCourses),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const { courseIds } = c.req.valid('json');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'reorder_path_courses');
        }

        const result = await reorderPathCoursesService(pathId, courseIds, actorId, orgRoles);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'reorder_path_courses', { pathId });
        }

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reorder learning path courses');
      }
    }
  )

  /**
   * DELETE /learning-path/:pathId/courses/:courseId
   * Removes a course from a learning path
   */
  .delete(
    '/:pathId/courses/:courseId',
    authOrAutomationKeyMiddleware,
    learningPathTeamOrAutomationKeyMiddleware(['learning_path:write']),
    zValidator('param', ZCourseParam),
    async (c) => {
      try {
        const actorId = c.get('actorId')!;
        const automationKey = c.get('automationKey');
        const orgRoles = getOrgRoles(c);
        const { pathId, courseId } = c.req.valid('param');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'remove_course_from_learning_path');
        }

        const removed = await removeCourseFromPathService(pathId, courseId, actorId, orgRoles);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'remove_course_from_learning_path', { pathId, courseId });
        }

        return c.json({ success: true, data: removed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove course from learning path');
      }
    }
  )

  /**
   * GET /learning-path/:pathId/members
   * Lists active members with their profiles (paginated)
   */
  .get(
    '/:pathId/members',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    zValidator('query', ZPathMembersQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const query = c.req.valid('query');
        const members = await listPathMembersService(pathId, user.id, orgRoles, query);

        return c.json({ success: true, ...members }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list learning path members');
      }
    }
  )

  /**
   * POST /learning-path/:pathId/members
   * Batch adds members to a learning path and auto-enrolls into courses.
   * Adds above the bulk threshold are queued and return 202 for polling.
   */
  .post(
    '/:pathId/members',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZAddLearningPathMembers),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');
        const result = await addPathMembersService(pathId, data, user.id, orgRoles);

        if (!Array.isArray(result)) {
          return c.json({ success: true, data: result }, 202);
        }

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add learning path members');
      }
    }
  )

  /**
   * GET /learning-path/:pathId/bulk-enrollment/:jobId
   * Status of a queued bulk member add for polling.
   */
  .get(
    '/:pathId/bulk-enrollment/:jobId',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZBulkStatusParam),
    zValidator('query', ZBulkStatusQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId, jobId } = c.req.valid('param');
        const { pollCount } = c.req.valid('query');
        const envelope = await getBulkPathEnrollmentStatus(pathId, jobId, user.id, orgRoles, pollCount);

        return c.json({ success: true, data: envelope }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to read bulk enrollment status');
      }
    }
  )

  /**
   * GET /learning-path/:pathId/members/:personId
   * Returns a member with per-course progress rows in path order
   */
  .get(
    '/:pathId/members/:personId',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPersonParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId, personId } = c.req.valid('param');
        const detail = await getPathMemberDetailService(pathId, personId, user.id, orgRoles);

        return c.json({ success: true, data: detail }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get learning path member detail');
      }
    }
  )

  /**
   * DELETE /learning-path/:pathId/members/:memberId
   * Soft-removes a member from a learning path and revokes their grants
   */
  .delete(
    '/:pathId/members/:memberId',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZMemberParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId, memberId } = c.req.valid('param');
        const removed = await removePathMemberService(pathId, memberId, user.id, orgRoles);

        return c.json({ success: true, data: removed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove learning path member');
      }
    }
  )

  /**
   * PATCH /learning-path/:pathId/members/:memberId
   * Changes a member's role between student and tutor
   */
  .patch(
    '/:pathId/members/:memberId',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZMemberParam),
    zValidator('json', ZUpdateLearningPathMemberRole),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId, memberId } = c.req.valid('param');
        const { roleId } = c.req.valid('json');
        const updated = await updatePathMemberRoleService(pathId, memberId, roleId, user.id, orgRoles);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update learning path member role');
      }
    }
  )

  /**
   * GET /learning-path/:pathId/analytics
   * Returns funnel metrics across courses in the learning path
   */
  .get('/:pathId/analytics', authMiddleware, learningPathTeamMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = getOrgRoles(c);
      const { pathId } = c.req.valid('param');
      const analytics = await getPathAnalyticsService(pathId, user.id, orgRoles);

      return c.json({ success: true, data: analytics }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path analytics');
    }
  })

  /**
   * GET /learning-path/:pathId/invite-link
   * Returns the path's shareable join link, or null if one was never created.
   */
  .get(
    '/:pathId/invite-link',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    async (c) => {
      try {
        const path = c.get('learningPath') as TLearningPath;
        const result = await fetchInviteLinkForResource('LEARNING_PATH', path.id);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load learning path invite link');
      }
    }
  )

  /**
   * POST /learning-path/:pathId/invite-link
   * Returns the path's shareable join link, creating it on first call.
   */
  .post(
    '/:pathId/invite-link',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const path = c.get('learningPath') as TLearningPath;
        const result = await getOrCreateInviteLinkForResource('LEARNING_PATH', path.id, user.id);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to create learning path invite link');
      }
    }
  )

  /**
   * PATCH /learning-path/:pathId/invite-link
   * Disables or re-enables the path's shareable join link.
   */
  .patch(
    '/:pathId/invite-link',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZToggleInviteLink),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { isRevoked } = c.req.valid('json');
        const path = c.get('learningPath') as TLearningPath;
        const result = await toggleInviteLinkForResource('LEARNING_PATH', path.id, isRevoked, user.id);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update learning path invite link');
      }
    }
  )

  /**
   * GET /learning-path/:pathId/journey
   * The caller's journey through a path they are enrolled in: every course in
   * order with live progress and lock state, the course to continue, and the
   * certificate when downloadable. Backs the path hub and the in-course stepper.
   */
  .get('/:pathId/journey', authMiddleware, learningPathMemberMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const path = c.get('learningPath') as TLearningPath;
      const member = c.get('learningPathMember') as TLearningPathMember | null;
      const journey = await getPathJourneyService(path, member, user.id);

      return c.json({ success: true, data: journey }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path journey');
    }
  })

  /**
   * POST /learning-path/:pathId/download/certificate
   * Streams a generated PDF of the learning path certificate
   */
  .post(
    '/:pathId/download/certificate',
    authMiddleware,
    learningPathMemberMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZLearningPathCertificateDownloadRequest),
    async (c) => {
      try {
        const { pathId } = c.req.valid('param');
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const body = c.req.valid('json');

        const input = await loadLearningPathCertificateInput(pathId, user.id, body, orgRoles);
        const buffer = await generateCertificatePdf(input);

        return sendCertificateFile(c, buffer, input.data.courseName, 'pdf');
      } catch (error) {
        return handleError(c, error, 'Failed to download learning path certificate');
      }
    }
  )

  /**
   * POST /learning-path/:pathId/download/certificate/png
   * Streams a generated PNG of the learning path certificate
   */
  .post(
    '/:pathId/download/certificate/png',
    authMiddleware,
    learningPathMemberMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZLearningPathCertificateDownloadRequest),
    async (c) => {
      try {
        const { pathId } = c.req.valid('param');
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const body = c.req.valid('json');

        const input = await loadLearningPathCertificateInput(pathId, user.id, body, orgRoles);
        const buffer = await generateCertificatePng(input);

        return sendCertificateFile(c, buffer, input.data.courseName, 'png');
      } catch (error) {
        return handleError(c, error, 'Failed to download learning path certificate image');
      }
    }
  );
