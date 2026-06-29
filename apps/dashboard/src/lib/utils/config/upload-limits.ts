import { resolveUploadLimits, type UploadLimits } from '@cio/utils/config/upload-limits';
import { env } from '$env/dynamic/private';

let cachedLimits: UploadLimits | null = null;

export function getUploadLimits(): UploadLimits {
  if (cachedLimits) {
    return cachedLimits;
  }

  cachedLimits = resolveUploadLimits({
    UPLOAD_MAX_DOCUMENT_MB: env.UPLOAD_MAX_DOCUMENT_MB,
    UPLOAD_MAX_IMAGE_MB: env.UPLOAD_MAX_IMAGE_MB,
    UPLOAD_MAX_VIDEO_MB: env.UPLOAD_MAX_VIDEO_MB,
    UPLOAD_MAX_EXERCISE_FILE_MB: env.UPLOAD_MAX_EXERCISE_FILE_MB,
    UPLOAD_MAX_AGENT_DOCUMENT_MB: env.UPLOAD_MAX_AGENT_DOCUMENT_MB,
    UPLOAD_MAX_LANDING_IMAGE_MB: env.UPLOAD_MAX_LANDING_IMAGE_MB,
    UPLOAD_MAX_THUMBNAIL_MB: env.UPLOAD_MAX_THUMBNAIL_MB
  });

  return cachedLimits;
}

export type { UploadLimits };
