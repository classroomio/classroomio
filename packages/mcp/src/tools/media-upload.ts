import { extname } from 'node:path';
import { readFile, stat } from 'node:fs/promises';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { TCoursePresignUrlUpload } from '@cio/utils/validation/course';
import * as z from 'zod';

const IMAGE_MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

const VIDEO_MIME_TYPES_BY_EXTENSION: Record<string, TCoursePresignUrlUpload['fileType']> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska'
};

function resolveMimeType<T extends string>(filePath: string, table: Record<string, T>, kind: string): T {
  const ext = extname(filePath).toLowerCase();
  const mimeType = table[ext];
  if (!mimeType) {
    throw new Error(
      `Unsupported ${kind} file extension "${ext || '(none)'}". Supported: ${Object.keys(table).join(', ')}`
    );
  }
  return mimeType;
}

function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export const ZUploadImageToolInput = z.object({
  filePath: z.string().min(1).describe('Absolute local file path to the image to upload.')
});

export const ZUploadVideoToolInput = z.object({
  filePath: z.string().min(1).describe('Absolute local file path to the video to upload.')
});

export const ZAttachLessonVideoToolInput = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  fileKey: z.string().min(1).describe('The fileKey returned by upload_video.'),
  downloadUrl: z.url().describe('The downloadUrl returned by upload_video.'),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(0).optional()
});

const uploadImageShape = ZUploadImageToolInput.shape as unknown as ZodRawShapeCompat;
const uploadVideoShape = ZUploadVideoToolInput.shape as unknown as ZodRawShapeCompat;
const attachLessonVideoShape = ZAttachLessonVideoToolInput.shape as unknown as ZodRawShapeCompat;

export function registerMediaUploadTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'upload_image',
    'Upload a local image file (jpg, jpeg, png, webp, gif) and get back a permanent public URL. Use the returned url with update_course_landing_page (imageUrl field) to set a course banner, or wherever else an image URL is needed. This only uploads the file — it does not attach it to anything.',
    uploadImageShape,
    async (args) => {
      const { filePath } = ZUploadImageToolInput.parse(args);
      const mimeType = resolveMimeType(filePath, IMAGE_MIME_TYPES_BY_EXTENSION, 'image');
      const buffer = await readFile(filePath);
      const result = await apiClient.uploadImage(buffer, fileNameFromPath(filePath), mimeType);
      return jsonContent(result);
    }
  );

  server.tool(
    'upload_video',
    'Upload a local video file (mp4, mov, avi, mkv) to storage. Returns { fileKey, downloadUrl, fileName, fileType, fileSize } — pass all of these to attach_lesson_video to actually attach the video to a lesson. This only uploads the file — it does not attach it to any lesson.',
    uploadVideoShape,
    async (args) => {
      const { filePath } = ZUploadVideoToolInput.parse(args);
      const fileType = resolveMimeType(filePath, VIDEO_MIME_TYPES_BY_EXTENSION, 'video');
      const fileName = fileNameFromPath(filePath);
      const [buffer, stats] = await Promise.all([readFile(filePath), stat(filePath)]);
      const fileSize = stats.size;

      const { url: uploadUrl, fileKey } = await apiClient.presignVideoUpload({ fileName, fileType, fileSize });
      await apiClient.putToPresignedUrl(uploadUrl, buffer, fileType);
      const { urls } = await apiClient.presignVideoDownload({ keys: [fileKey] });
      const downloadUrl = urls[fileKey];
      if (!downloadUrl) {
        throw new Error('Upload succeeded but no download URL was returned for the uploaded file.');
      }

      return jsonContent({ fileKey, downloadUrl, fileName, fileType, fileSize });
    }
  );

  server.tool(
    'attach_lesson_video',
    'Attach a previously uploaded video (from upload_video) to a specific lesson. Preserves any videos already on the lesson.',
    attachLessonVideoShape,
    async (args) => {
      const { courseId, lessonId, ...payload } = ZAttachLessonVideoToolInput.parse(args);
      const result = await apiClient.attachLessonVideo(courseId, lessonId, payload);
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
