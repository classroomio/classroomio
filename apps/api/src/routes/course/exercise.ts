import { ErrorCodes, handleError } from '@api/utils/errors';
import {
  ZExerciseCreate,
  ZExerciseFromTemplate,
  ZExerciseGetParam,
  ZExerciseListQuery,
  ZExerciseSubmissionCreate,
  ZExerciseUpdate,
  ZExerciseVideoRecordingParam,
  ZExerciseVideoRecordingPlaybackParam,
  ZExerciseVideoRecordingUploadComplete,
  ZExerciseVideoRecordingUploadInit
} from '@cio/utils/validation/exercise';
import { ZTemplateById, ZTemplateByTag } from '@cio/utils/validation/mocks';
import {
  createExercise,
  createExerciseFromTemplate,
  deleteExerciseForCourseService,
  deleteExerciseService,
  getExercise,
  listExercises,
  updateExerciseService
} from '@cio/core/services/exercise/exercise';
import { fetchAllTemplatesMetadata, fetchTemplateById, fetchTemplatesByTag } from '@api/services/exercise/template';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import {
  completeVideoRecordingUpload,
  getVideoRecordingPlaybackUrl,
  initVideoRecordingUpload
} from '@api/services/exercise/video-recording';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { courseMemberOrAutomationKeyMiddleware } from '@api/middlewares/course-member-or-automation-key';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { createSubmissionService, listExerciseSubmissionsOverview } from '@api/services/submission';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { ContentType } from '@cio/utils/constants';
import { zValidator } from '@hono/zod-validator';

export const exerciseRouter = new Hono()
  // Exercise CRUD routes
  .get(
    '/',
    authOrAutomationKeyMiddleware,
    courseMemberOrAutomationKeyMiddleware(['course:exercise:read']),
    zValidator('query', ZExerciseListQuery),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const user = c.get('user');
        const automationKey = c.get('automationKey');
        const { lessonId, sectionId } = c.req.valid('query');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'list_course_exercises');
        }

        const exercises = await listExercises(courseId, { lessonId, sectionId }, user?.id);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'list_course_exercises', { courseId, lessonId, sectionId });
        }

        return c.json({ success: true, data: exercises }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list exercises');
      }
    }
  )
  .get('/:exerciseId/submissions', authMiddleware, courseMemberMiddleware, async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const exerciseId = c.req.param('exerciseId')!;
      const user = c.get('user')!;

      const data = await listExerciseSubmissionsOverview(courseId, exerciseId, user.id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch exercise submissions overview');
    }
  })
  .get(
    '/:exerciseId',
    authOrAutomationKeyMiddleware,
    courseMemberOrAutomationKeyMiddleware(['course:exercise:read']),
    zValidator('param', ZExerciseGetParam),
    async (c) => {
      try {
        const { exerciseId } = c.req.valid('param');
        const user = c.get('user');
        const automationKey = c.get('automationKey');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'get_course_exercise');
        }

        if (user?.id && !automationKey) {
          await assertEnrolledStudentContentAccess({
            courseId: c.req.param('courseId')!,
            profileId: user.id,
            contentId: exerciseId,
            type: ContentType.Exercise
          });
        }

        const exercise = await getExercise(exerciseId, undefined, user?.id);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'get_course_exercise', {
            courseId: c.req.param('courseId')!,
            exerciseId
          });
        }

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch exercise');
      }
    }
  )
  .post(
    '/',
    authOrAutomationKeyMiddleware,
    courseMemberOrAutomationKeyMiddleware(['course:exercise:write']),
    zValidator('json', ZExerciseCreate),
    async (c) => {
      try {
        const data = c.req.valid('json');
        const automationKey = c.get('automationKey');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'create_course_exercise');
        }

        const exercise = await createExercise(data);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'create_course_exercise', {
            courseId: c.req.param('courseId')!,
            exerciseId: exercise.id
          });
        }

        return c.json({ success: true, data: exercise }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create exercise');
      }
    }
  )
  /**
   * POST /course/:courseId/exercise/from-template
   * Creates an exercise from a template
   * Requires authentication and course membership (admin/tutor role)
   */
  .post(
    '/from-template',
    authOrAutomationKeyMiddleware,
    courseMemberOrAutomationKeyMiddleware(['course:exercise:write']),
    zValidator('json', ZExerciseFromTemplate),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const automationKey = c.get('automationKey');
        const { lessonId, sectionId, order, templateId } = c.req.valid('json');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'create_course_exercise_from_template');
        }

        // Fetch template from database
        const template = await fetchTemplateById(templateId);
        if (!template) {
          return c.json({ success: false, error: 'Template not found' }, 404);
        }

        if (!template.questionnaire) {
          return c.json({ success: false, error: 'Template is missing questionnaire data' }, 400);
        }

        const exercise = await createExerciseFromTemplate(courseId, lessonId, sectionId, order, template);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'create_course_exercise_from_template', {
            courseId,
            exerciseId: exercise.id,
            templateId
          });
        }

        return c.json({ success: true, data: exercise }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create exercise from template');
      }
    }
  )
  .put(
    '/:exerciseId',
    authOrAutomationKeyMiddleware,
    courseMemberOrAutomationKeyMiddleware(['course:exercise:write']),
    zValidator('param', ZExerciseGetParam),
    zValidator('json', ZExerciseUpdate),
    async (c) => {
      try {
        const { exerciseId } = c.req.valid('param');
        const data = c.req.valid('json');
        const courseId = c.req.param('courseId')!;
        const user = c.get('user');
        const automationKey = c.get('automationKey');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'update_course_exercise');
        }

        if (!automationKey && user && data.isUnlocked !== undefined) {
          const isAuthorized = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);

          if (!isAuthorized) {
            return c.json(
              {
                success: false,
                error: 'Unauthorized',
                code: ErrorCodes.UNAUTHORIZED
              },
              403
            );
          }
        }

        const exercise = await updateExerciseService(exerciseId, data);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'update_course_exercise', { courseId, exerciseId });
        }

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update exercise');
      }
    }
  )
  .delete('/:exerciseId', authMiddleware, courseMemberMiddleware, zValidator('param', ZExerciseGetParam), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { exerciseId } = c.req.valid('param');
      const exercise = await deleteExerciseForCourseService(courseId, exerciseId);

      return c.json({ success: true, data: exercise }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete exercise');
    }
  })
  // Exercise Submission routes
  .post(
    '/:exerciseId/submission',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZExerciseGetParam),
    zValidator('json', ZExerciseSubmissionCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { exerciseId } = c.req.valid('param');
        const { answers } = c.req.valid('json');

        const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, user.id);
        if (!groupMemberId) {
          return c.json({ success: false, error: 'User is not a member of this course' }, 403);
        }

        await assertEnrolledStudentContentAccess({
          courseId,
          profileId: user.id,
          contentId: exerciseId,
          type: ContentType.Exercise
        });

        const submission = await createSubmissionService(courseId, exerciseId, groupMemberId, answers);

        return c.json({ success: true, data: submission }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to submit exercise');
      }
    }
  )
  .post(
    '/:exerciseId/question/:questionId/video-recording/upload/init',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZExerciseVideoRecordingParam),
    zValidator('json', ZExerciseVideoRecordingUploadInit),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { exerciseId, questionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const upload = await initVideoRecordingUpload(courseId, exerciseId, questionId, user.id, data);

        return c.json({ success: true, data: upload }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to initialize video recording upload');
      }
    }
  )
  .post(
    '/:exerciseId/question/:questionId/video-recording/upload/complete',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZExerciseVideoRecordingParam),
    zValidator('json', ZExerciseVideoRecordingUploadComplete),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { exerciseId, questionId } = c.req.valid('param');
        const data = c.req.valid('json');

        const answer = await completeVideoRecordingUpload(courseId, exerciseId, questionId, user.id, data);

        return c.json({ success: true, data: answer }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to complete video recording upload');
      }
    }
  )
  .get(
    '/:exerciseId/submission/:submissionId/question/:questionId/video-recording/playback',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZExerciseVideoRecordingPlaybackParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { exerciseId, submissionId, questionId } = c.req.valid('param');

        const playback = await getVideoRecordingPlaybackUrl(courseId, exerciseId, submissionId, questionId, user.id);

        return c.json({ success: true, data: playback }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to get video recording playback URL');
      }
    }
  )
  // Template routes
  .get('/template', authMiddleware, courseMemberMiddleware, async (c) => {
    try {
      const result = await fetchAllTemplatesMetadata();

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template metadata');
    }
  })
  .get('/template/:id', authMiddleware, courseMemberMiddleware, zValidator('param', ZTemplateById), async (c) => {
    try {
      const { id } = c.req.valid('param');

      const result = await fetchTemplateById(id);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  })
  .get('/template/tag/:tag', authMiddleware, courseMemberMiddleware, zValidator('param', ZTemplateByTag), async (c) => {
    try {
      const { tag } = c.req.valid('param');

      const result = await fetchTemplatesByTag(tag);
      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load template');
    }
  });
