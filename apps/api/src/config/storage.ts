/**
 * Object storage configuration for S3-compatible backends (Cloudflare R2, MinIO, AWS S3).
 * Supports both generic OBJECT_STORAGE_* vars and backward-compatible CLOUDFLARE_* fallback.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@api/config/env';

const BUCKET_DEFAULTS = {
  VIDEOS: 'videos',
  DOCUMENTS: 'documents',
  MEDIA: 'media'
} as const;

/** Whether we're using the generic S3-compatible config (MinIO, etc.) vs Cloudflare R2 fallback */
export function useS3CompatibleConfig(): boolean {
  return Boolean(
    env.OBJECT_STORAGE_ENDPOINT && env.OBJECT_STORAGE_ACCESS_KEY_ID && env.OBJECT_STORAGE_SECRET_ACCESS_KEY
  );
}

function isCloudflareConfigured(): boolean {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_ACCESS_KEY && env.CLOUDFLARE_SECRET_ACCESS_KEY);
}

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  bucketVideos: string;
  bucketDocuments: string;
  bucketMedia: string;
  mediaPublicBaseUrl: string | null;
  presignUploadExpiresSeconds: number;
  presignDownloadExpiresSeconds: number;
}

function resolveStorageConfig(): StorageConfig {
  if (useS3CompatibleConfig()) {
    const forcePathStyle =
      env.OBJECT_STORAGE_FORCE_PATH_STYLE === 'true' || env.OBJECT_STORAGE_FORCE_PATH_STYLE === '1';
    return {
      endpoint: env.OBJECT_STORAGE_ENDPOINT!,
      region: env.OBJECT_STORAGE_REGION || 'us-east-1',
      accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY!,
      forcePathStyle,
      bucketVideos: env.OBJECT_STORAGE_BUCKET_VIDEOS || BUCKET_DEFAULTS.VIDEOS,
      bucketDocuments: env.OBJECT_STORAGE_BUCKET_DOCUMENTS || BUCKET_DEFAULTS.DOCUMENTS,
      bucketMedia: env.OBJECT_STORAGE_BUCKET_MEDIA || BUCKET_DEFAULTS.MEDIA,
      mediaPublicBaseUrl: env.OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL || null,
      presignUploadExpiresSeconds: 60 * 60, // 1 hour
      presignDownloadExpiresSeconds: 60 * 60 // 1 hour
    };
  }

  if (isCloudflareConfigured()) {
    return {
      endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKeyId: env.CLOUDFLARE_ACCESS_KEY!,
      secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY!,
      forcePathStyle: false,
      bucketVideos: BUCKET_DEFAULTS.VIDEOS,
      bucketDocuments: BUCKET_DEFAULTS.DOCUMENTS,
      bucketMedia: BUCKET_DEFAULTS.MEDIA,
      mediaPublicBaseUrl: env.CLOUDFLARE_IMAGE_BUCKET_DOMAIN || null,
      presignUploadExpiresSeconds: 60 * 60,
      presignDownloadExpiresSeconds: 60 * 60
    };
  }

  throw new Error(
    'Object storage not configured. Set either OBJECT_STORAGE_ENDPOINT, OBJECT_STORAGE_ACCESS_KEY_ID, OBJECT_STORAGE_SECRET_ACCESS_KEY (for MinIO/S3) or CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY, CLOUDFLARE_SECRET_ACCESS_KEY (for Cloudflare R2).'
  );
}

let cachedConfig: StorageConfig | null = null;

export function getStorageConfig(): StorageConfig {
  if (!cachedConfig) {
    cachedConfig = resolveStorageConfig();
    if (useS3CompatibleConfig()) {
      console.log('[storage] Using S3-compatible object storage');
    } else {
      console.log('[storage] Using Cloudflare R2 (fallback)');
    }
  }
  return cachedConfig;
}

/** S3 client for API operations (upload, get, delete). Uses internal endpoint. */
let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const config = getStorageConfig();
    s3ClientInstance = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      forcePathStyle: config.forcePathStyle
    });
  }
  return s3ClientInstance;
}

/**
 * S3 client for generating presigned URLs. Uses public endpoint when configured
 * (e.g. when internal endpoint like minio:9000 is not reachable by browser).
 */
let presignClientInstance: S3Client | null = null;

export function getPresignS3Client(): S3Client {
  if (!presignClientInstance) {
    const config = getStorageConfig();
    const endpoint = env.OBJECT_STORAGE_PUBLIC_ENDPOINT || config.endpoint;
    presignClientInstance = new S3Client({
      region: config.region,
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      forcePathStyle: config.forcePathStyle
    });
  }
  return presignClientInstance;
}

export { BUCKET_DEFAULTS };
