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
