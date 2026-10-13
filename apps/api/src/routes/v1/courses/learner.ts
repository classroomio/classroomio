import {
  ZPublicApiCourseLearnerExerciseParam,
  ZPublicApiCourseLearnerLessonParam,
  ZPublicApiCourseSubmissionResponse,
  ZPublicApiCreateLearnerSubmission,
  ZPublicApiLearnerLessonCompletionResponse,
  ZPublicApiSetLearnerLessonCompletion
} from '@cio/utils/validation/public-api';
import { createLearnerSubmissionService, setLearnerLessonCompletionService } from '@api/services/v1/courses/learner';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, learnerForbiddenResponse, mcpRateLimitResponse } from './docs';

const TAG = 'Learner Activity';

export const v1CourseLearnerRouter = new Hono()
  .put(
    '/lessons/:lessonId/completion',
    describeRoute({
      description: `Record a lesson as completed for a student, or undo it. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Completion saved. Sending the same body twice gives the same result. Completing a lesson also checks whether the student has now earned the course certificate.',
          itemResponse(ZPublicApiLearnerLessonCompletionResponse)
        ),
        400: {
          description:
            'Invalid path or body, the member is not a student, or the lesson completes on video watch and cannot be completed by hand'
        },
        401: errorResponses.unauthorized,
        403: learnerForbiddenResponse,
        404: { description: 'Course, member or lesson not found, or the course is not published' },
        409: { description: 'The member has not accepted their invite yet' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLearnerLessonParam),
    validator('json', ZPublicApiSetLearnerLessonCompletion),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const completion = await setLearnerLessonCompletionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: completion }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to set lesson completion');
      }
    }
  )
  .post(
    '/exercises/:exerciseId/submissions',
    describeRoute({
      description: `Submit an exercise for a student. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse(
          'Submission created. It is already graded (gradingState completed, with a total) when every question can be auto-graded. Tutors are emailed, as when a student submits in the dashboard. Read the answers with GET /courses/{courseId}/submissions/{submissionId}.',
          itemResponse(ZPublicApiCourseSubmissionResponse)
        ),
        400: {
          description:
            'Invalid path or body, the member is not a student, an answer breaks a question rule, or a question needs a file or video upload'
        },
        401: errorResponses.unauthorized,
        403: learnerForbiddenResponse,
        404: { description: 'Course, member, exercise or question not found, or the course is not published' },
        409: {
          description:
            'The exercise allows one submission and the student already has one, or the member has not accepted their invite yet'
        },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLearnerExerciseParam),
    validator('json', ZPublicApiCreateLearnerSubmission),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const submission = await createLearnerSubmissionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: submission }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to submit exercise');
      }
    }
  );
