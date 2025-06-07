import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3';

import { CLOUDFLARE } from '$src/constants';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type GetSignedUrlParameters = Parameters<typeof getSignedUrl>;

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE.CONFIGS.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE.CONFIGS.ACCESS_KEY,
    secretAccessKey: CLOUDFLARE.CONFIGS.SECRET_ACCESS_KEY
  }
});

export async function uploadToS3(
  params: PutObjectCommandInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await s3Client.send(new PutObjectCommand(params));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getFromS3(
  params: GetObjectCommandInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const data = await s3Client.send(new GetObjectCommand(params));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteFromS3(
  params: DeleteObjectCommandInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await s3Client.send(new DeleteObjectCommand(params));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
