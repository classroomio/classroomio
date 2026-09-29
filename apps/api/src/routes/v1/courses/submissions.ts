import {
  ZPublicApiCourseParam,
  ZPublicApiCourseSubmissionDetailResponse,
  ZPublicApiCourseSubmissionListItemResponse,
  ZPublicApiCourseSubmissionParam,
  ZPublicApiCourseSubmissionResponse,
  ZPublicApiCourseSubmissionsQuery,
  ZPublicApiGradeCourseSubmission,
  ZPublicApiUpdateCourseSubmission
} from '@cio/utils/validation/public-api';
import {
  deleteCourseSubmissionService,
  getCourseSubmissionService,
  gradeCourseSubmissionService,
  listCourseSubmissionsService,
  updateCourseSubmissionService
} from '@api/services/v1/courses/submissions';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, PAGINATION_NOTE, mcpRateLimitResponse, submissionForbiddenResponses } from './docs';

const TAG = 'Public API Course Submissions';
const SubmissionResponse = itemResponse(ZPublicApiCourseSubmissionResponse);

const GRADING_STATES_NOTE =
  'gradingState moves queued → processing → completed, awaiting_manual or failed; awaiting_manual → completed; failed → queued. Any other change returns 400.';

export const v1CourseSubmissionsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List learner submissions for a course's exercises, newest first. Filter by exerciseId, memberId (a course member id) or gradingState. Answers are not included; fetch a single submission for them. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Submissions returned successfully',
          paginatedResponse(ZPublicApiCourseSubmissionListItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: submissionForbiddenResponses.read,
        404: { description: 'Course, exercise or member not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseSubmissionsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await listCourseSubmissionsService(orgId, actorId, c.req.valid('param'), c.req.valid('query'));

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course submissions');
      }
    }
  )
  .get(
    '/:submissionId',
    describeRoute({
      description: `Get a submission with the learner's answers and the points given for each. File and video answers include a short-lived download URL. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Submission returned successfully', itemResponse(ZPublicApiCourseSubmissionDetailResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: submissionForbiddenResponses.read,
        404: { description: 'Course or submission not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseSubmissionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const submission = await getCourseSubmissionService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course submission');
      }
    }
  )
  .put(
    '/:submissionId/grades',
    describeRoute({
      description: `Grade a submission: set the points for each answer, the total and optional feedback, and mark it completed, like saving grades in the dashboard. questionIds must belong to the submission's exercise. The learner is emailed when the submission first becomes graded. Grading an already completed submission again updates the grades. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Submission graded successfully', SubmissionResponse),
        400: { description: 'Invalid path or body, or the submission cannot move to completed from its current state' },
        401: errorResponses.unauthorized,
        403: submissionForbiddenResponses.write,
        404: { description: 'Course, submission or question not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseSubmissionParam),
    validator('json', ZPublicApiGradeCourseSubmission),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const submission = await gradeCourseSubmissionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to grade course submission');
      }
    }
  )
  .patch(
    '/:submissionId',
    describeRoute({
      description: `Change a submission's grading state or feedback without grading it. To grade, use PUT /courses/{courseId}/submissions/{submissionId}/grades. The learner is emailed when the state changes. ${GRADING_STATES_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Submission updated successfully', SubmissionResponse),
        400: { description: 'Invalid path or body, or a grading state change that is not allowed' },
        401: errorResponses.unauthorized,
        403: submissionForbiddenResponses.write,
        404: { description: 'Course or submission not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseSubmissionParam),
    validator('json', ZPublicApiUpdateCourseSubmission),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const submission = await updateCourseSubmissionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course submission');
      }
    }
  )
  .delete(
    '/:submissionId',
    describeRoute({
      description: `Permanently delete a submission and its answers, so the learner can submit again. This is a hard delete and cannot be undone. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Submission deleted successfully', SubmissionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: submissionForbiddenResponses.write,
        404: { description: 'Course or submission not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseSubmissionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const submission = await deleteCourseSubmissionService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: submission }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete course submission');
      }
    }
  );
