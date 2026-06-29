import { getUploadLimits } from '@cio/core/config/upload-limits';

const limits = getUploadLimits();

// API-specific constants (file size limits)
export const MAX_FILE_SIZE = limits.videoBytes;
export const MAX_DOCUMENT_SIZE = limits.documentBytes;
export const MAX_IMAGE_SIZE = limits.imageBytes;
export const MAX_EXERCISE_FILE_SIZE = limits.exerciseFileBytes;
export const MAX_AGENT_DOCUMENT_SIZE = limits.agentDocumentBytes;

export { getUploadLimits };

// API-specific constants (bucket names)
export const BUCKET_NAME = {
  VIDEOS: 'videos',
  DOCUMENTS: 'documents',
  MEDIA: 'media'
} as const;
