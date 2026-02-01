/**
 * Validation Constants
 *
 * Shared constants used across validation schemas.
 * These should match the constants in the API.
 */

export const ALLOWED_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword' // .doc
] as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const;

/**
 * Question Type Constants
 * These match the question_type table in the database
 */
export const QUESTION_TYPE = {
  RADIO: 1,
  CHECKBOX: 2,
  TEXTAREA: 3
} as const;
