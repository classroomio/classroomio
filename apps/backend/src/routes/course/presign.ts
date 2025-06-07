import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE } from '$src/constants/upload';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { ZCourseDownloadPresignedUrl, ZCoursePresignUrlUpload } from '$src/types/course';

import { CLOUDFLARE } from '$src/constants';
import type { GetSignedUrlParameters } from '$src/utils/s3';
import { Hono } from 'hono';
import { authMiddleware } from '$src/middlewares/auth';
import { generateFileKey } from '$src/utils/upload';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '$src/utils/s3';
import { z } from 'zod';

export const presignRouter = new Hono();

const uploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(ALLOWED_CONTENT_TYPES, {
    errorMap: () => ({
      message: `Invalid content type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    })
  }),
  fileSize: z.number().max(MAX_FILE_SIZE, 'File is too large. Maximum size is 500MB')
});

presignRouter.post('/upload', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCoursePresignUrlUpload.parse(body);

  const { fileName, fileType } = result;
  const fileKey = generateFileKey(fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE.R2.BUCKET,
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

presignRouter.post('/download', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDownloadPresignedUrl.parse(body);

  const { fileNames } = result;

  try {
    const signedUrls: Record<string, string> = {};

    await Promise.all(
      fileNames.map(async (fileName) => {
        const command = new GetObjectCommand({
          Bucket: CLOUDFLARE.R2.BUCKET,
          Key: fileName
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        signedUrls[fileName] = presignedUrl;
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
