import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getPresignS3Client, getS3Client, getStorageConfig } from '@api/config/storage';

export type GetSignedUrlParameters = Parameters<typeof getSignedUrl>;

export async function uploadToS3(params: PutObjectCommandInput): Promise<{ success: boolean; error?: string }> {
  try {
    await getS3Client().send(new PutObjectCommand(params));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getFromS3(
  params: GetObjectCommandInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await getS3Client().send(new GetObjectCommand(params));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteFromS3(params: DeleteObjectCommandInput): Promise<{ success: boolean; error?: string }> {
  try {
    await getS3Client().send(new DeleteObjectCommand(params));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generates presigned URLs for download for a list of keys in a specific bucket
 * @param keys Array of S3 keys
 * @param bucketName Bucket name (e.g., 'videos', 'documents')
 * @returns Record mapping keys to presigned URLs
 */
export async function generateDownloadPresignedUrls(
  keys: string[],
  bucketName: string
): Promise<Record<string, string>> {
  const signedUrls: Record<string, string> = {};
  const config = getStorageConfig();
  const client = getPresignS3Client();

  if (keys.length === 0) {
    return signedUrls;
  }

  const urlPromises = keys.map(async (key) => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      }) as GetSignedUrlParameters[1];

      const presignedUrl = await getSignedUrl(client as GetSignedUrlParameters[0], command, {
        expiresIn: config.presignDownloadExpiresSeconds
      });

      return { key, presignedUrl };
    } catch (error) {
      console.error(`Failed to generate presigned URL for key "${key}" in bucket "${bucketName}":`, error);
      return null;
    }
  });

  const results = await Promise.all(urlPromises);

  results.forEach((result) => {
    if (result) {
      signedUrls[result.key] = result.presignedUrl;
    }
  });

  return signedUrls;
}

/**
 * Generates a presigned URL for upload
 * @param fileKey S3 key for the file
 * @param bucketName Bucket name (e.g., 'videos', 'documents')
 * @param contentType MIME type of the file
 * @returns Presigned URL for upload
 */
export async function generateUploadPresignedUrl(
  fileKey: string,
  bucketName: string,
  contentType: string
): Promise<string> {
  const config = getStorageConfig();
  const client = getPresignS3Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType
  }) as GetSignedUrlParameters[1];

  const presignedUrl = await getSignedUrl(client as GetSignedUrlParameters[0], command, {
    expiresIn: config.presignUploadExpiresSeconds
  });

  return presignedUrl;
}

/**
 * Generates presigned URLs for video download
 * @param keys Array of video keys
 * @returns Record mapping keys to presigned URLs
 */
export async function generateVideoDownloadPresignedUrls(keys: string[]): Promise<Record<string, string>> {
  const config = getStorageConfig();
  return generateDownloadPresignedUrls(keys, config.bucketVideos);
}

/**
 * Generates presigned URLs for document download
 * @param keys Array of document keys
 * @returns Record mapping keys to presigned URLs
 */
export async function generateDocumentDownloadPresignedUrls(keys: string[]): Promise<Record<string, string>> {
  const config = getStorageConfig();
  return generateDownloadPresignedUrls(keys, config.bucketDocuments);
}

/**
 * Generates a presigned URL for video upload
 * @param fileKey S3 key for the video file
 * @param contentType MIME type of the video file
 * @returns Presigned URL for upload
 */
export async function generateVideoUploadPresignedUrl(fileKey: string, contentType: string): Promise<string> {
  const config = getStorageConfig();
  return generateUploadPresignedUrl(fileKey, config.bucketVideos, contentType);
}

/**
 * Generates a presigned URL for document upload
 * @param fileKey S3 key for the document file
 * @param contentType MIME type of the document file
 * @returns Presigned URL for upload
 */
export async function generateDocumentUploadPresignedUrl(fileKey: string, contentType: string): Promise<string> {
  const config = getStorageConfig();
  return generateUploadPresignedUrl(fileKey, config.bucketDocuments, contentType);
}
