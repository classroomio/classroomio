import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  ZCourseDocumentPresignUrlUpload,
  ZCourseDownloadPresignedUrl,
  ZCoursePresignUrlUpload
} from '@cio/utils/validation/course';
import { describeRoute, validator } from 'hono-openapi';

import { BUCKET_NAME } from '@api/constants/upload';
import { CLOUDFLARE } from '@api/constants';
import type { GetSignedUrlParameters } from '@api/utils/s3';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { generateFileKey } from '@api/utils/upload';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getFromS3 } from '@api/utils/s3';
import { videoQueue } from '@cio/queue';
import type { ProcessVideoUploadJobData } from '@cio/queue';

// Response schemas for OpenAPI documentation
const PresignUploadResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    url: { type: 'string' as const },
    fileKey: { type: 'string' as const },
    message: { type: 'string' as const }
  },
  required: ['success', 'url', 'fileKey', 'message']
};

const PresignDownloadResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    urls: {
      type: 'object' as const,
      additionalProperties: { type: 'string' as const }
    },
    message: { type: 'string' as const }
  },
  required: ['success', 'urls', 'message']
};

export const presignRouter = new Hono()
  .post(
    '/video/upload',
    authMiddleware,
    describeRoute({
      description: 'Generate a pre-signed URL for video upload',
      responses: {
        200: {
          description: 'Pre-signed URL generated successfully',
          content: {
            'application/json': {
              schema: PresignUploadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        }
      },
      tags: ['Presign']
    }),
    validator('json', ZCoursePresignUrlUpload),
    async (c) => {
      const body = c.req.valid('json');
      const user = c.get('user');

      const { fileName, fileType } = body;
      const fileKey = generateFileKey(fileName);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME.VIDEOS,
        Key: fileKey,
        ContentType: fileType
      }) as GetSignedUrlParameters[1];

      const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
        expiresIn: CLOUDFLARE.R2.PRESIGN_EXPIRATION_TIME
      });

      // queuing video upload

      const jobData: ProcessVideoUploadJobData = {
        fileKey,
        fileName,
        fileType,
        userId: user?.id,
        metadata: {
          bucket: BUCKET_NAME.VIDEOS,
          contentType: fileType
        }
      };

      await videoQueue.add('process-upload', jobData, {
        jobId: `video-${fileKey}`,
        delay: 30000 // 30 second delay to allow upload to complete
      });

      return c.json({
        success: true,
        url: presignedUrl,
        fileKey,
        message: 'Pre-signed URL generated successfully'
      });
    }
  )
  .post(
    '/document/upload',
    authMiddleware,
    describeRoute({
      description: 'Generate a pre-signed URL for document upload',
      responses: {
        200: {
          description: 'Document pre-signed URL generated successfully',
          content: {
            'application/json': {
              schema: PresignUploadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        }
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDocumentPresignUrlUpload),
    async (c) => {
      const body = c.req.valid('json');

      const { fileName, fileType } = body;
      const fileKey = generateFileKey(fileName);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME.DOCUMENTS,
        Key: fileKey,
        ContentType: fileType
      }) as GetSignedUrlParameters[1];

      const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
        expiresIn: CLOUDFLARE.R2.PRESIGN_EXPIRATION_TIME
      });

      return c.json({
        success: true,
        url: presignedUrl,
        fileKey,
        message: 'Document pre-signed URL generated successfully'
      });
    }
  )
  .post(
    '/video/download',
    authMiddleware,
    describeRoute({
      description: 'Generate pre-signed URLs for video download',
      responses: {
        200: {
          description: 'Video URLs retrieved successfully',
          content: {
            'application/json': {
              schema: PresignDownloadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        }
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/69565117-5d4c-47f3-9d91-b4c474cac93e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'presign.ts:188',
          message: 'video/download endpoint called',
          data: { keys, keysCount: keys.length },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
      // #endregion

      const signedUrls: Record<string, string> = {};

      const urlPromises = keys.map(async (key) => {
        // Check if file exists in S3 before generating presigned URL
        const fileCheck = await getFromS3({
          Bucket: BUCKET_NAME.VIDEOS,
          Key: key
        });

        if (!fileCheck.success) {
          return { key, presignedUrl: null, error: fileCheck.error };
        }

        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME.VIDEOS,
          Key: key
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        return { key, presignedUrl };
      });

      const results = await Promise.all(urlPromises);

      results.forEach(({ key, presignedUrl, error }) => {
        if (presignedUrl) {
          signedUrls[key] = presignedUrl;
        }
      });

      return c.json({
        success: true,
        urls: signedUrls,
        message: 'Video URLs retrieved successfully'
      });
    }
  )
  .post(
    '/document/download',
    authMiddleware,
    describeRoute({
      description: 'Generate pre-signed URLs for document download',
      responses: {
        200: {
          description: 'Document URLs retrieved successfully',
          content: {
            'application/json': {
              schema: PresignDownloadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        }
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      const signedUrls: Record<string, string> = {};

      const urlPromises = keys.map(async (key) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME.DOCUMENTS,
          Key: key
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        return { key, presignedUrl };
      });

      const results = await Promise.all(urlPromises);

      results.forEach(({ key, presignedUrl }) => {
        signedUrls[key] = presignedUrl;
      });

      return c.json({
        success: true,
        urls: signedUrls,
        message: 'Document URLs retrieved successfully'
      });
    }
  )
  .get(
    '/hls/stream/:lessonId/:videoKey',
    authMiddleware,
    describeRoute({
      description: 'Get HLS manifest for video streaming',
      responses: {
        200: {
          description: 'HLS manifest',
          content: {
            'application/vnd.apple.mpegurl': {
              schema: { type: 'string' }
            }
          }
        },
        404: {
          description: 'Manifest not found'
        },
        401: {
          description: 'Unauthorized'
        }
      },
      tags: ['Presign']
    }),
    async (c) => {
      const lessonId = c.req.param('lessonId');
      const videoKey = decodeURIComponent(c.req.param('videoKey'));

      try {
        // Get manifest from S3
        const manifestKey = `${videoKey}/playlist.m3u8`;
        const manifestResult = await getFromS3({
          Bucket: BUCKET_NAME.VIDEOS,
          Key: manifestKey
        });

        if (!manifestResult.success || !manifestResult.data) {
          return c.json(
            {
              success: false,
              message: 'HLS manifest not found. Video may still be processing.'
            },
            404
          );
        }

        // Read manifest content
        const manifestBody = manifestResult.data.Body;
        if (!manifestBody) {
          return c.json(
            {
              success: false,
              message: 'Manifest body is empty'
            },
            404
          );
        }

        // Convert stream to string
        const chunks: Uint8Array[] = [];
        const reader = (manifestBody as any).transformToWebStream().getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        const manifestText = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');

        // Replace segment filenames with our endpoint URLs
        const segmentBaseUrl = `/course/presign/hls/segment/${lessonId}/${encodeURIComponent(videoKey)}`;
        const updatedManifest = manifestText
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            // Replace segment filenames (e.g., "segment_000.ts") with our endpoint
            if (trimmed.endsWith('.ts') && !trimmed.startsWith('http') && !trimmed.startsWith('/')) {
              return `${segmentBaseUrl}/${trimmed}`;
            }
            return line;
          })
          .join('\n');

        return c.text(updatedManifest, 200, {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        });
      } catch (error) {
        console.error('Error serving HLS manifest:', error);
        return c.json(
          {
            success: false,
            message: 'Error serving HLS manifest'
          },
          500
        );
      }
    }
  )
  .get(
    '/hls/segment/:lessonId/:videoKey/:segmentId',
    authMiddleware,
    describeRoute({
      description: 'Get HLS segment (served directly)',
      responses: {
        200: {
          description: 'HLS segment',
          content: {
            'video/mp2t': {
              schema: { type: 'string' }
            }
          }
        },
        404: {
          description: 'Segment not found'
        },
        401: {
          description: 'Unauthorized'
        }
      },
      tags: ['Presign']
    }),
    async (c) => {
      const lessonId = c.req.param('lessonId');
      const videoKey = decodeURIComponent(c.req.param('videoKey'));
      const segmentId = c.req.param('segmentId');

      try {
        const segmentKey = `${videoKey}/segments/${segmentId}`;

        // Get the segment data from S3 (serve directly like previous branch)
        const segmentResult = await getFromS3({
          Bucket: BUCKET_NAME.VIDEOS,
          Key: segmentKey
        });

        if (!segmentResult.success || !segmentResult.data) {
          return c.json(
            {
              success: false,
              message: 'Segment not found'
            },
            404
          );
        }

        const segmentBody = segmentResult.data.Body;
        if (!segmentBody) {
          return c.json(
            {
              success: false,
              message: 'Segment body is empty'
            },
            404
          );
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const reader = (segmentBody as any).transformToWebStream().getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

        // Return the segment with proper headers (like previous branch)
        return c.body(buffer, 200, {
          'Content-Type': 'video/mp2t',
          'Cache-Control': 'public, max-age=30',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Range'
        });
      } catch (error) {
        console.error('Error serving segment:', error);
        return c.json(
          {
            success: false,
            message: 'Error serving segment'
          },
          500
        );
      }
    }
  );
