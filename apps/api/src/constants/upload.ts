// API-specific constants (file size limits)
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// API-specific constants (bucket names)
export const BUCKET_NAME = {
  VIDEOS: 'videos',
  DOCUMENTS: 'documents',
  MEDIA: 'media'
} as const;
