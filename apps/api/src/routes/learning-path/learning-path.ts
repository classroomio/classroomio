import {
  ZAddLearningPathCourse,
  ZAddLearningPathMembers,
  ZCreateLearningPath,
  ZEnrollInLearningPath,
  ZEnrolledLearningPathsQuery,
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
import type { TLearningPath } from '@cio/db/types';

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
  getEnrolledLearningPaths,
  getLearningPathDetail,
  getPathAnalyticsService,
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
  .get('/', authMiddleware, zValidator('query', ZGetLearningPathsQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = getOrgRoles(c);
      const { organizationId, page, limit, search } = c.req.valid('query');
      const result = await listOrgLearningPaths(organizationId, user.id, orgRoles, { page, limit, search });

      return c.json({ success: true, data: result.data, pagination: result.pagination }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list learning paths');
    }
  })

  /**
   * POST /learning-path
   * Creates a new learning path in UNPUBLISHED status
   */
  .post('/', authMiddleware, zValidator('json', ZCreateLearningPath), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = getOrgRoles(c);
      const { organizationId, ...data } = c.req.valid('json');
      const path = await createLearningPathService(organizationId, user.id, data, orgRoles);

      return c.json({ success: true, data: path }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create learning path');
    }
  })

  /**
   * GET /learning-path/enrolled
   * Returns caller's enrolled learning paths with live progress and per-course unlock status.
   * Accepts an optional organizationId to scope to one workspace; omitted
   * returns enrollments across organizations (existing behavior).
   */
  .get('/enrolled', authMiddleware, zValidator('query', ZEnrolledLearningPathsQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const { organizationId } = c.req.valid('query');
      const paths = await getEnrolledLearningPaths(user.id, organizationId);

      return c.json({ success: true, data: paths }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get enrolled learning paths');
    }
  })

  /**
   * GET /learning-path/:pathId
   * Gets detail of a learning path including its ordered courses
   */
  .get('/:pathId', authMiddleware, zValidator('param', ZPathParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgRoles = getOrgRoles(c);
      const { pathId } = c.req.valid('param');
      const path = await getLearningPathDetail(pathId, user.id, orgRoles);

      return c.json({ success: true, data: path }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get learning path detail');
    }
  })

  /**
   * PUT /learning-path/:pathId
   * Updates a learning path
   */
  .put(
    '/:pathId',
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZUpdateLearningPath),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const rawData = c.req.valid('json');
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

        const path = await updateLearningPathService(pathId, user.id, data, orgRoles);

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
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZAddLearningPathCourse),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const data = c.req.valid('json');
        const courses = await addCoursesToPathService(pathId, data, user.id, orgRoles);

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
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZPathParam),
    zValidator('json', ZReorderLearningPathCourses),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId } = c.req.valid('param');
        const { courseIds } = c.req.valid('json');
        const result = await reorderPathCoursesService(pathId, courseIds, user.id, orgRoles);

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
    authMiddleware,
    learningPathTeamMiddleware,
    zValidator('param', ZCourseParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgRoles = getOrgRoles(c);
        const { pathId, courseId } = c.req.valid('param');
        const removed = await removeCourseFromPathService(pathId, courseId, user.id, orgRoles);

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
