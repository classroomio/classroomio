import {
  ZActivityAttachPackage,
  ZActivityCreate,
  ZActivityLaunch,
  ZActivityParam,
  ZActivityUpdate
} from '@cio/utils/validation/activity';
import { ZScormResultsProfileParam, ZScormResultsQuery } from '@cio/utils/validation/activity/report';
import { ZScormSettings } from '@cio/utils/validation/activity/scorm';
import type { TActivityKind } from '@cio/utils/constants/activity';
import { ContentType, ROLE } from '@cio/utils/constants';
import { getActivityCompletionsByProfile } from '@cio/db/queries/activity/activity';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { getComplianceCycleStartIso } from '@cio/db/queries/course/compliance';
import { getCourseMembers } from '@cio/db/queries/course/people';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { attachScormPackage, detachScormPackage } from '@cio/core/services/activity/providers';
import { getComplianceSnapshot } from '@cio/core/services/activity/providers/scorm/results';
import {
  runActivityCompletionSideEffects,
  scheduleActivityCompletionSideEffectsRetry
} from '@api/services/activity/activity-completion';
import {
  createActivity,
  deleteActivityService,
  getActivity,
  getActivityForStudent,
  getActivityLearnerResult,
  getActivityProgress,
  getActivityResults,
  getActivityWithEditorData,
  launchActivity,
  resetActivityLearner,
  updateActivityService
} from '@cio/core/services/activity/activity';
import { saveActivitySettings } from '@api/services/activity/activity-settings';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { assertActivityKindAllowed } from '@api/services/activity/plan';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

async function assertScormAuthoringAllowed(courseId: string, kind: string): Promise<void> {
  if (kind !== 'scorm') return;

  const organizationId = await getOrgIdByCourseId(courseId);
  if (!organizationId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);

  await assertActivityKindAllowed(organizationId, kind as TActivityKind);
}

export const activityRouter = new Hono()
  .get('/:activityId', authMiddleware, courseMemberMiddleware, zValidator('param', ZActivityParam), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { activityId } = c.req.valid('param');
      const user = c.get('user')!;
      const isAuthor = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      if (isAuthor) {
        const result = await getActivityWithEditorData(courseId, activityId);
        return c.json({ success: true, data: result }, 200);
      }

      await assertEnrolledStudentContentAccess({
        courseId,
        profileId: user.id,
        contentId: activityId,
        type: ContentType.Activity
      });
      const result = await getActivityForStudent(courseId, activityId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch activity');
    }
  })
  .post('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZActivityCreate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');
      await assertScormAuthoringAllowed(courseId, data.kind);
      const result = await createActivity(courseId, data, user.id);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create activity');
    }
  })
  .put(
    '/:activityId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam),
    zValidator('json', ZActivityUpdate),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId } = c.req.valid('param');
        const data = c.req.valid('json');
        const existing = await getActivity(courseId, activityId);
        await assertScormAuthoringAllowed(courseId, existing.kind);
        const result = await updateActivityService(courseId, activityId, data);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update activity');
      }
    }
  )
  .put(
    '/:activityId/settings',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam),
    zValidator('json', ZScormSettings),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId } = c.req.valid('param');
        const data = c.req.valid('json');
        const existing = await getActivity(courseId, activityId);
        await assertScormAuthoringAllowed(courseId, existing.kind);
        await saveActivitySettings(courseId, activityId, data);

        return c.json({ success: true, data: { activityId } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update activity settings');
      }
    }
  )
  .put(
    '/:activityId/package',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam),
    zValidator('json', ZActivityAttachPackage),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId } = c.req.valid('param');
        const data = c.req.valid('json');
        const user = c.get('user')!;
        const existing = await getActivity(courseId, activityId);
        await assertScormAuthoringAllowed(courseId, existing.kind);
        const organizationId = await getOrgIdByCourseId(courseId);
        if (!organizationId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
        const attachResult = await attachScormPackage(activityId, data.assetId, organizationId, user.id);
        const title = attachResult && 'title' in attachResult ? attachResult.title : undefined;

        return c.json({ success: true, data: { activityId, assetId: data.assetId, title } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to attach package');
      }
    }
  )
  .delete(
    '/:activityId/package',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId } = c.req.valid('param');
        const existing = await getActivity(courseId, activityId);
        await assertScormAuthoringAllowed(courseId, existing.kind);
        await detachScormPackage(activityId);

        return c.json({ success: true, data: { activityId } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove package');
      }
    }
  )
  .delete(
    '/:activityId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId } = c.req.valid('param');
        const result = await deleteActivityService(courseId, activityId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete activity');
      }
    }
  )
  .post(
    '/:activityId/launch',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZActivityParam),
    zValidator('json', ZActivityLaunch),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const user = c.get('user')!;
        const { activityId } = c.req.valid('param');
        const data = c.req.valid('json');
        await assertEnrolledStudentContentAccess({
          courseId,
          profileId: user.id,
          contentId: activityId,
          type: ContentType.Activity
        });
        const organizationId = await getOrgIdByCourseId(courseId);
        if (!organizationId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
        const isPreview = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
        const result = await launchActivity(courseId, activityId, data, {
          profileId: user.id,
          organizationId,
          isPreview
        });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to launch activity');
      }
    }
  )
  .get(
    '/:activityId/progress',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZActivityParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const user = c.get('user')!;
        const { activityId } = c.req.valid('param');
        await assertEnrolledStudentContentAccess({
          courseId,
          profileId: user.id,
          contentId: activityId,
          type: ContentType.Activity
        });
        const isPreview = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
        const result = await getActivityProgress(courseId, activityId, { profileId: user.id, isPreview });

        if (!isPreview) {
          const cycleStart = await getComplianceCycleStartIso(courseId, user.id);
          const completedIds = await getActivityCompletionsByProfile([activityId], user.id, undefined, cycleStart);
          if (completedIds.length > 0) {
            void (async () => {
              try {
                const snapshot = await getComplianceSnapshot(activityId, user.id);
                await runActivityCompletionSideEffects(activityId, user.id, snapshot?.minutes);
              } catch (err) {
                console.error('Failed to reconcile activity completion side effects on progress fetch:', err);
                scheduleActivityCompletionSideEffectsRetry(activityId, user.id);
              }
            })();
          }
        }

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch activity progress');
      }
    }
  )
  .get(
    '/:activityId/results',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam),
    zValidator('query', ZScormResultsQuery),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId } = c.req.valid('param');
        const paging = c.req.valid('query');
        const members = await getCourseMembers(courseId);
        const studentProfileIds = members
          .filter((member) => member.roleId === ROLE.STUDENT && member.profileId)
          .map((member) => member.profileId as string);
        const result = await getActivityResults(courseId, activityId, studentProfileIds, paging);

        return c.json(
          {
            success: true,
            data: result.learners,
            summary: result.summary,
            pagination: {
              page: paging.page,
              limit: paging.limit,
              total: result.total,
              totalPages: Math.ceil(result.total / paging.limit)
            }
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch activity results');
      }
    }
  )
  .get(
    '/:activityId/results/:profileId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam.and(ZScormResultsProfileParam)),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId, profileId } = c.req.valid('param');
        const result = await getActivityLearnerResult(courseId, activityId, profileId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch learner attempts');
      }
    }
  )
  .post(
    '/:activityId/results/:profileId/reset',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZActivityParam.and(ZScormResultsProfileParam)),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { activityId, profileId } = c.req.valid('param');
        const result = await resetActivityLearner(courseId, activityId, profileId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reset learner attempts');
      }
    }
  );
