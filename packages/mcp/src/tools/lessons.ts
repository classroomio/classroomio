import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import * as z from 'zod';

const CREATE: ToolAnnotations = {
  title: 'Create lesson',
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false
};
const UPDATE: ToolAnnotations = {
  title: 'Update lesson',
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true
};

const ZLessonVideo = z.union([
  z.object({
    type: z.literal('upload'),
    assetId: z.string().uuid().describe('An assetId returned by upload_video.')
  }),
  z.object({
    type: z.enum(['youtube', 'vimeo', 'generic']),
    link: z.url().describe('Public video URL. Embedded rather than downloaded.')
  })
]);

const VIDEOS_DESCRIPTION =
  'Videos for this lesson. Use { "type": "upload", "assetId": "..." } for a file uploaded with upload_video, or { "type": "youtube" | "vimeo" | "generic", "link": "..." } for an external URL.';

const ORDER_DESCRIPTION =
  'Position within the section, starting at 1. Without a section, the position among the course top-level sections, lessons and exercises; the entry at that position and every later one move down one.';

export const ZCreateLessonToolInput = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(255),
  order: z.number().int().min(1).describe(ORDER_DESCRIPTION),
  sectionId: z.string().uuid().optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  videos: z.array(ZLessonVideo).max(20).optional().describe(VIDEOS_DESCRIPTION)
});

export const ZUpdateLessonToolInput = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().min(1).optional().describe(ORDER_DESCRIPTION),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  lessonAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .optional()
    .describe('Live-session start time as an ISO 8601 timestamp with a UTC offset; null clears it.'),
  videos: z
    .array(ZLessonVideo)
    .max(20)
    .optional()
    .describe(`${VIDEOS_DESCRIPTION} Supplying this replaces the lesson's videos entirely.`)
});

const createLessonShape = ZCreateLessonToolInput.shape as unknown as ZodRawShapeCompat;
const updateLessonShape = ZUpdateLessonToolInput.shape as unknown as ZodRawShapeCompat;

export function registerLessonTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'create_lesson',
    'Create a lesson directly in the selected course; videos become video blocks, and add notes and slides with add_lesson_block. Attaching an uploaded video starts thumbnailing and adaptive-bitrate encoding, plus transcription when configured.',
    createLessonShape,
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCreateLessonToolInput.parse(args);
      const result = await apiClient.createLesson(courseId, payload);

      return jsonContent(result);
    }
  );

  server.tool(
    'update_lesson',
    "Update a lesson directly in the selected course; omitted fields stay unchanged. Supplying videos replaces the lesson's video blocks entirely, so prefer the block tools to change one block.",
    updateLessonShape,
    UPDATE,
    async (args) => {
      const { courseId, lessonId, ...payload } = ZUpdateLessonToolInput.parse(args);
      const result = await apiClient.updateLesson(courseId, lessonId, payload);

      return jsonContent(result);
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
