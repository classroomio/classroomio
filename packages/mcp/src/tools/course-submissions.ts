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

const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const COURSE_MEMBER_RULE =
  'the API key creator must be a course member (directly or through a program) or an org admin';

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
    `List students' exercise submissions for a course, newest first, without their answers; ${COURSE_TEAM_RULE}. Use get_course_submission to read answers.`,
    shape(ZListCourseSubmissionsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseSubmissionsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseSubmissions(courseId, query));
    }
  );

  server.tool(
    'get_course_submission',
    `Get one submission with the student's answers and the points given for each; ${COURSE_TEAM_RULE}. Pair it with get_course_exercise to see the questions and correct answers.`,
    shape(ZGetCourseSubmissionToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, submissionId } = ZGetCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.getCourseSubmission(courseId, submissionId));
    }
  );

  server.tool(
    'grade_course_submission',
    `Grade a submission and mark it completed, emailing the student the first time; ${COURSE_TEAM_RULE}. Take each questionId from get_course_exercise.`,
    shape(ZGradeCourseSubmissionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, submissionId, ...payload } = ZGradeCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.gradeCourseSubmission(courseId, submissionId, payload));
    }
  );

  server.tool(
    'update_course_submission',
    `Change a submission's gradingState or feedback without grading it; ${COURSE_TEAM_RULE}. To grade, use grade_course_submission.`,
    shape(ZUpdateCourseSubmissionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, submissionId, ...payload } = ZUpdateCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseSubmission(courseId, submissionId, payload));
    }
  );

  server.tool(
    'delete_course_submission',
    `Permanently delete a submission and its answers so the student can submit again; ${COURSE_TEAM_RULE}.`,
    shape(ZDeleteCourseSubmissionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, submissionId } = ZDeleteCourseSubmissionToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseSubmission(courseId, submissionId));
    }
  );

  server.tool(
    'get_course_marks',
    `Get a course's gradebook, with each student's points on every exercise; ${COURSE_MEMBER_RULE}. If the key creator is a student, only their own row comes back.`,
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
