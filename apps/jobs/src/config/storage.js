'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getStorageConfig = getStorageConfig;
exports.getS3Client = getS3Client;
var client_s3_1 = require('@aws-sdk/client-s3');
var env_1 = require('./env');
/**
 * Worker-side S3 client. Mirrors apps/api/src/config/storage.ts so workers
 * can stream the same buckets the API uploads to. Kept self-contained so
 * apps/jobs has no runtime dependency on apps/api.
 */
var BUCKET_DEFAULTS = {
  VIDEOS: 'videos',
  DOCUMENTS: 'documents',
  MEDIA: 'media'
};
function useS3CompatibleConfig() {
  return Boolean(
    env_1.env.OBJECT_STORAGE_ENDPOINT &&
      env_1.env.OBJECT_STORAGE_ACCESS_KEY_ID &&
      env_1.env.OBJECT_STORAGE_SECRET_ACCESS_KEY
  );
}
function isCloudflareConfigured() {
  return Boolean(
    env_1.env.CLOUDFLARE_ACCOUNT_ID && env_1.env.CLOUDFLARE_ACCESS_KEY && env_1.env.CLOUDFLARE_SECRET_ACCESS_KEY
  );
}
var cachedConfig = null;
function getStorageConfig() {
  if (cachedConfig) return cachedConfig;
  if (useS3CompatibleConfig()) {
    cachedConfig = {
      endpoint: env_1.env.OBJECT_STORAGE_ENDPOINT,
      region: env_1.env.OBJECT_STORAGE_REGION || 'us-east-1',
      accessKeyId: env_1.env.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env_1.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
      forcePathStyle:
        env_1.env.OBJECT_STORAGE_FORCE_PATH_STYLE === 'true' || env_1.env.OBJECT_STORAGE_FORCE_PATH_STYLE === '1',
      bucketVideos: env_1.env.OBJECT_STORAGE_BUCKET_VIDEOS || BUCKET_DEFAULTS.VIDEOS,
      bucketDocuments: env_1.env.OBJECT_STORAGE_BUCKET_DOCUMENTS || BUCKET_DEFAULTS.DOCUMENTS,
      bucketMedia: env_1.env.OBJECT_STORAGE_BUCKET_MEDIA || BUCKET_DEFAULTS.MEDIA,
      mediaPublicBaseUrl: env_1.env.OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL || null
    };
  } else if (isCloudflareConfigured()) {
    cachedConfig = {
      endpoint: 'https://'.concat(env_1.env.CLOUDFLARE_ACCOUNT_ID, '.r2.cloudflarestorage.com'),
      region: 'auto',
      accessKeyId: env_1.env.CLOUDFLARE_ACCESS_KEY,
      secretAccessKey: env_1.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      forcePathStyle: false,
      bucketVideos: BUCKET_DEFAULTS.VIDEOS,
      bucketDocuments: BUCKET_DEFAULTS.DOCUMENTS,
      bucketMedia: BUCKET_DEFAULTS.MEDIA,
      mediaPublicBaseUrl: env_1.env.CLOUDFLARE_IMAGE_BUCKET_DOMAIN || null
    };
  } else {
    throw new Error(
      'Object storage not configured. Set OBJECT_STORAGE_* (MinIO/S3) or CLOUDFLARE_* (R2) env vars on apps/jobs.'
    );
  }
  return cachedConfig;
}
var s3Client = null;
function getS3Client() {
  if (s3Client) return s3Client;
  var config = getStorageConfig();
  s3Client = new client_s3_1.S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: config.forcePathStyle
  });
  return s3Client;
}
