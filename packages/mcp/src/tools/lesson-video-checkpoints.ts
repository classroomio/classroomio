import {
  ZPublicApiCourseLessonParam,
  ZPublicApiCreateVideoCheckpointFields,
  ZPublicApiUpdateVideoCheckpointFields,
  ZPublicApiVideoCheckpointParam
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const PAID_PLAN_NOTE = 'the organization must be on a paid plan';

export const ZListLessonVideoCheckpointsToolInput = ZPublicApiCourseLessonParam;
export const ZCreateLessonVideoCheckpointToolInput = ZPublicApiCreateVideoCheckpointFields.extend(
  ZPublicApiCourseLessonParam.shape
);
export const ZUpdateLessonVideoCheckpointToolInput = ZPublicApiUpdateVideoCheckpointFields.extend(
  ZPublicApiVideoCheckpointParam.shape
);
export const ZDeleteLessonVideoCheckpointToolInput = ZPublicApiVideoCheckpointParam;
export const ZGetLessonVideoCheckpointResultsToolInput = ZPublicApiCourseLessonParam;

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerLessonVideoCheckpointTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_lesson_video_checkpoints',
    `List the questions that pause a lesson's uploaded videos, with their answer keys; ${COURSE_TEAM_RULE}.`,
    shape(ZListLessonVideoCheckpointsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId } = ZListLessonVideoCheckpointsToolInput.parse(args);
      return jsonContent(await apiClient.listLessonVideoCheckpoints(courseId, lessonId));
    }
  );

  server.tool(
    'create_lesson_video_checkpoint',
    `Add a question that pauses an uploaded lesson video at a time; ${COURSE_TEAM_RULE}, and ${PAID_PLAN_NOTE}. Take assetId from the lesson's uploaded videos.`,
    shape(ZCreateLessonVideoCheckpointToolInput),
    CREATE,
    async (args) => {
      const { courseId, lessonId, ...payload } = ZCreateLessonVideoCheckpointToolInput.parse(args);
      return jsonContent(
        await apiClient.createLessonVideoCheckpoint(courseId, lessonId, {
          ...payload,
          settings: payload.settings ?? {},
          resumePolicy: payload.resumePolicy ?? 'any',
          options: payload.options ?? []
        })
      );
    }
  );

  server.tool(
    'update_lesson_video_checkpoint',
    `Replace a video question, which clears the answers learners already gave; ${COURSE_TEAM_RULE}, and ${PAID_PLAN_NOTE}. Send the whole question, since options are replaced as a set.`,
    shape(ZUpdateLessonVideoCheckpointToolInput),
    UPDATE,
    async (args) => {
      const { courseId, lessonId, checkpointId, ...payload } = ZUpdateLessonVideoCheckpointToolInput.parse(args);
      return jsonContent(
        await apiClient.updateLessonVideoCheckpoint(courseId, lessonId, checkpointId, {
          ...payload,
          settings: payload.settings ?? {},
          resumePolicy: payload.resumePolicy ?? 'any',
          options: payload.options ?? []
        })
      );
    }
  );

  server.tool(
    'delete_lesson_video_checkpoint',
    `Permanently delete a video question and the answers learners gave it; ${COURSE_TEAM_RULE}.`,
    shape(ZDeleteLessonVideoCheckpointToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, lessonId, checkpointId } = ZDeleteLessonVideoCheckpointToolInput.parse(args);
      return jsonContent(await apiClient.deleteLessonVideoCheckpoint(courseId, lessonId, checkpointId));
    }
  );

  server.tool(
    'get_lesson_video_checkpoint_results',
    `Read how learners answered a lesson's video questions: % correct and the most chosen wrong answer per question, plus each learner's answers; ${COURSE_TEAM_RULE}, and ${PAID_PLAN_NOTE}.`,
    shape(ZGetLessonVideoCheckpointResultsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId } = ZGetLessonVideoCheckpointResultsToolInput.parse(args);
      return jsonContent(await apiClient.getLessonVideoCheckpointResults(courseId, lessonId));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
