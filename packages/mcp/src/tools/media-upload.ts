import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { TPublicApiCreateAsset } from '@cio/utils/validation/public-api';
import * as z from 'zod';

const MIME_TYPE_BY_EXTENSION: Record<string, TPublicApiCreateAsset['mimeType']> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska'
};

function resolveMimeType(filePath: string): TPublicApiCreateAsset['mimeType'] {
  const extension = extname(filePath).toLowerCase();
  const mimeType = MIME_TYPE_BY_EXTENSION[extension];

  if (!mimeType) {
    throw new Error(
      `Unsupported video extension "${extension || '(none)'}". Supported: ${Object.keys(MIME_TYPE_BY_EXTENSION).join(', ')}`
    );
  }

  return mimeType;
}

function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export const ZUploadVideoToolInput = z.object({
  filePath: z.string().min(1).describe('Absolute local path to the video file to upload.')
});

const uploadVideoShape = ZUploadVideoToolInput.shape as unknown as ZodRawShapeCompat;

export function registerMediaUploadTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'upload_video',
    'Upload a local video file (mp4, mov, avi, mkv) to ClassroomIO. Returns { assetId } — pass that to create_lesson or update_lesson in videos[] as { "type": "upload", "assetId": "..." } to attach it. Attaching is what starts thumbnailing, transcription and adaptive-bitrate encoding, so an uploaded video should always be attached to a lesson.',
    uploadVideoShape,
    async (args) => {
      const { filePath } = ZUploadVideoToolInput.parse(args);
      const mimeType = resolveMimeType(filePath);
      const fileName = fileNameFromPath(filePath);

      // Reserve before reading: the API validates the declared size against the
      // organization's limit, so an oversized file is refused before it is
      // pulled into this process.
      const byteSize = (await stat(filePath)).size;
      const { assetId, uploadUrl } = await apiClient.createAssetUpload({
        kind: 'video',
        fileName,
        mimeType,
        byteSize
      });

      // Streamed rather than read into a Buffer: a large video would otherwise
      // sit in this process in full, and concurrent uploads would multiply that.
      await apiClient.putToPresignedUrl(uploadUrl, createReadStream(filePath), mimeType, byteSize);

      return jsonContent({ assetId, fileName, mimeType, byteSize });
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
