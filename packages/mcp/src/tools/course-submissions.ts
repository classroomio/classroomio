import {
  ZPublicApiCourseMarksQuery,
  ZPublicApiCourseParam,
  ZPublicApiCourseSubmissionParam,
  ZPublicApiCourseSubmissionsQuery,
  ZPublicApiGradeCourseSubmission,
  ZPublicApiUpdateCourseSubmission
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const COURSE_TEAM_RULE =
  'The API key creator must be a course tutor/admin or an org admin, otherwise the call fails with 403.';
const COURSE_MEMBER_RULE =
  'The API key creator must be a member of the course (including access through a program) or an org admin, otherwise the call fails with 403.';
const PAGINATION_NOTE = 'Paginated: page (default 1) and limit (default 20, max 100); the result includes pagination.';

export const ZListCourseSubmissionsToolInput = ZPublicApiCourseSubmissionsQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZGetCourseSubmissionToolInput = ZPublicApiCourseSubmissionParam;
export const ZGradeCourseSubmissionToolInput = ZPublicApiGradeCourseSubmission.safeExtend(
  ZPublicApiCourseSubmissionParam.shape
);
export const ZUpdateCourseSubmissionToolInput = ZPublicApiUpdateCourseSubmission.safeExtend(
  ZPublicApiCourseSubmissionParam.shape
);
export const ZDeleteCourseSubmissionToolInput = ZPublicApiCourseSubmissionParam;
export const ZGetCourseMarksToolInput = ZPublicApiCourseMarksQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseSubmissionTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_submissions',
    `List learners' exercise submissions for a course, newest first, without their answers. Filter by exerciseId, memberId (a course member id) or gradingState (queued, processing, awaiting_manual, completed, failed). Use get_course_submission to read answers. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZListCourseSubmissionsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseSubmissionsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseSubmissions(courseId, query));
    }
  );

  server.tool(
    'get_course_submission',
    `Get one submission with the learner's answers and the points given for each. File and video answers include a short-lived download URL. Pair it with get_course_exercise to see the questions and correct answers. ${COURSE_TEAM_RULE}`,
    shape(ZGetCourseSubmissionToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, submissionId } = ZGetCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.getCourseSubmission(courseId, submissionId));
    }
  );

  server.tool(
    'grade_course_submission',
    `Grade a submission: set the points for each answer (questionId from get_course_exercise), the total, and optional feedback, and mark it completed. The learner is emailed when it first becomes graded. Grading it again overwrites the grades. ${COURSE_TEAM_RULE}`,
    shape(ZGradeCourseSubmissionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, submissionId, ...payload } = ZGradeCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.gradeCourseSubmission(courseId, submissionId, payload));
    }
  );

  server.tool(
    'update_course_submission',
    `Change a submission's gradingState or feedback without grading it (use grade_course_submission to grade). Allowed moves: queued → processing → completed, awaiting_manual or failed; awaiting_manual → completed; failed → queued. The learner is emailed when the state changes. ${COURSE_TEAM_RULE}`,
    shape(ZUpdateCourseSubmissionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, submissionId, ...payload } = ZUpdateCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseSubmission(courseId, submissionId, payload));
    }
  );

  server.tool(
    'delete_course_submission',
    `Permanently delete a submission and its answers so the learner can submit again. This is a hard delete and cannot be undone. ${COURSE_TEAM_RULE}`,
    shape(ZDeleteCourseSubmissionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, submissionId } = ZDeleteCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseSubmission(courseId, submissionId));
    }
  );

  server.tool(
    'get_course_marks',
    `Get a course's gradebook: one row per student with their points on every exercise (null when not graded yet). If the key creator is a student, only their own row comes back. ${PAGINATION_NOTE} ${COURSE_MEMBER_RULE}`,
    shape(ZGetCourseMarksToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZGetCourseMarksToolInput.parse(args);
      return jsonContent(await apiClient.getCourseMarks(courseId, query));
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
