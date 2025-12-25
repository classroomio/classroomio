import { GetObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME } from '@api/constants/upload';
import { s3Client, uploadToS3 } from '@api/utils/s3';
import { env } from '@api/config/env';

/**
 * Download video file from R2
 */
export async function downloadVideoFromR2(fileKey: string): Promise<Buffer> {
  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME.VIDEOS,
      Key: fileKey,
    })
  );

  if (!result.Body) {
    throw new Error(`Video file not found: ${fileKey}`);
  }

  const chunks: Uint8Array[] = [];
  const reader = result.Body.transformToWebStream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks into single buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(buffer);
}

/**
 * Upload file to R2
 */
export async function uploadFileToR2(
  fileKey: string,
  content: Buffer | string,
  contentType: string,
  bucket: string = BUCKET_NAME.VIDEOS
): Promise<void> {
  const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

  const result = await uploadToS3({
    Bucket: bucket,
    Key: fileKey,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  });

  if (!result.success) {
    throw new Error(`Failed to upload file to R2: ${result.error}`);
  }
}

/**
 * Get public URL for R2 file
 */
export function getR2PublicUrl(fileKey: string, bucket: string = BUCKET_NAME.VIDEOS): string {
  const bucketDomain = env.CLOUDFLARE_VIDEO_BUCKET_DOMAIN || env.CLOUDFLARE_BUCKET_DOMAIN;
  if (!bucketDomain) {
    throw new Error('CLOUDFLARE_VIDEO_BUCKET_DOMAIN or CLOUDFLARE_BUCKET_DOMAIN not configured');
  }
  return `${bucketDomain}/${fileKey}`;
}

/**
 * Upload multiple files to R2
 */
export async function uploadFilesToR2(
  files: Array<{ key: string; content: Buffer | string; contentType: string }>,
  bucket: string = BUCKET_NAME.VIDEOS
): Promise<void> {
  await Promise.all(
    files.map((file) => uploadFileToR2(file.key, file.content, file.contentType, bucket))
  );
}
