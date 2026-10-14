import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import * as z from 'zod';

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

export const ZCreateLessonToolInput = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(255),
  order: z.number().int().min(1).describe('Position within the section, starting at 1.'),
  sectionId: z.string().uuid().optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
  videos: z.array(ZLessonVideo).max(20).optional().describe(VIDEOS_DESCRIPTION)
});

export const ZUpdateLessonToolInput = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().min(1).optional(),
  isUnlocked: z.boolean().optional(),
  public: z.boolean().optional(),
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
    'Create a lesson in a course, optionally with videos. Attaching an uploaded video here is what starts its thumbnail, transcript and adaptive-bitrate encoding.',
    createLessonShape,
    async (args) => {
      const { courseId, ...payload } = ZCreateLessonToolInput.parse(args);
      const result = await apiClient.createLesson(courseId, payload);

      return jsonContent(result);
    }
  );

  server.tool(
    'update_lesson',
    "Update a lesson. Omitted fields are left unchanged; supplying videos replaces the lesson's videos entirely.",
    updateLessonShape,
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
