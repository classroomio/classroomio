import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  ZCourseDocumentPresignUrlUpload,
  ZCourseDownloadPresignedUrl,
  ZCoursePresignUrlUpload
} from '$src/types/course';

import { BUCKET_NAME } from '$src/constants/upload';
import { CLOUDFLARE } from '$src/constants';
import type { GetSignedUrlParameters } from '$src/utils/s3';
import { Hono } from 'hono';
import { authMiddleware } from '$src/middlewares/auth';
import { generateFileKey } from '$src/utils/upload';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '$src/utils/s3';

export const presignRouter = new Hono();

// Note: Lesson access verification is handled on the client side
// Users cannot access course data without proper permissions

// Helper function to generate HLS manifest
function generateHLSManifest(videoKey: string, lessonId: string): string {
  const baseUrl = `/api/course/presign/hls/segment/${lessonId}/${videoKey}`;

  // TODO: This is a mock implementation. For a real implementation, you need to:
  // 1. Use FFmpeg to segment the video into .ts files and upload them to R2
  // 2. Store video metadata (duration, segment count, segment durations) in database
  // 3. Generate manifest based on actual video metadata
  // 4. For now, we'll use the original video file as a single "segment"

  // For now, we'll create a simple manifest that points to the original video
  // This will work but doesn't provide the security benefits of true segmentation
  const manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:300
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:300.0,
${baseUrl}/original.mp4

#EXT-X-ENDLIST`;

  return manifest;
}

presignRouter.post('/upload', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCoursePresignUrlUpload.parse(body);

  const { fileName, fileType } = result;
  const fileKey = generateFileKey(fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME.VIDEOS,
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
      message: 'Pre-signed URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);

    if (error instanceof Error && error.name === 'SignatureDoesNotMatch') {
      return c.json(
        {
          success: false,
          type: 'SIGNATURE_ERROR',
          message: 'Invalid signature for the request'
        },
        403
      );
    }

    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating pre-signed URL'
      },
      500
    );
  }
});

presignRouter.post('/document/upload', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDocumentPresignUrlUpload.parse(body);

  const { fileName, fileType } = result;
  const fileKey = generateFileKey(fileName);

  try {
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
  } catch (error) {
    console.error('Error generating document pre-signed URL:', error);

    if (error instanceof Error && error.name === 'SignatureDoesNotMatch') {
      return c.json(
        {
          success: false,
          type: 'SIGNATURE_ERROR',
          message: 'Invalid signature for the request'
        },
        403
      );
    }

    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating document pre-signed URL'
      },
      500
    );
  }
});

presignRouter.post('/download', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDownloadPresignedUrl.parse(body);

  const { keys } = result;

  try {
    const signedUrls: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME.VIDEOS,
          Key: key
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        signedUrls[key] = presignedUrl;
      })
    );

    return c.json({
      success: true,
      urls: signedUrls,
      message: 'Video URLs retrieved successfully'
    });
  } catch (error) {
    console.error('Error Retrieving Video:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error Retrieving Video'
      },
      500
    );
  }
});

presignRouter.post('/download/document', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDownloadPresignedUrl.parse(body);

  const { keys } = result;

  try {
    const signedUrls: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME.DOCUMENTS,
          Key: key
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        signedUrls[key] = presignedUrl;
      })
    );

    return c.json({
      success: true,
      urls: signedUrls,
      message: 'Document URLs retrieved successfully'
    });
  } catch (error) {
    console.error('Error Retrieving Document:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error Retrieving Document'
      },
      500
    );
  }
});

// HLS Streaming Endpoints for Enhanced Video Security
presignRouter.get('/hls/stream/:lessonId/:videoKey', authMiddleware, async (c) => {
  const lessonId = c.req.param('lessonId');
  const videoKey = c.req.param('videoKey');

  try {
    // Generate HLS manifest
    const manifest = generateHLSManifest(videoKey, lessonId);

    return c.text(manifest, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range'
      }
    });
  } catch (error) {
    console.error('Error generating HLS manifest:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating HLS manifest'
      },
      500
    );
  }
});

presignRouter.get('/hls/segment/:lessonId/:videoKey/:segmentId', authMiddleware, async (c) => {
  const { lessonId, videoKey, segmentId } = c.req.param();

  try {
    // For now, serve the original video file as a "segment"
    // TODO: Implement actual video segmentation with FFmpeg
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME.VIDEOS,
      Key: videoKey // Use the original video key for now
    }) as GetSignedUrlParameters[1];

    const segmentUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
      expiresIn: CLOUDFLARE.R2.HLS_SEGMENT_EXPIRATION_TIME
    });

    return c.redirect(segmentUrl);
  } catch (error) {
    console.error('Error generating segment URL:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating segment URL'
      },
      500
    );
  }
});
