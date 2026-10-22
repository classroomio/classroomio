import { QUESTION_TYPE_IDS } from '@cio/question-types';
import { FILE_UPLOAD_ALLOWED_MIME_TYPES } from '../file-upload';

/**
 * Validation Constants
 *
 * Shared constants used across validation schemas.
 * These should match the constants in the API.
 */

export const ALLOWED_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'] as const;

export const ALLOWED_DOCUMENT_TYPES = FILE_UPLOAD_ALLOWED_MIME_TYPES;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const;

export const ALLOWED_SCORM_TYPES = ['application/zip', 'application/x-zip-compressed'] as const;

/**
 * Browsers report ZIP files inconsistently, so an empty type is accepted.
 * The worker verifies the ZIP magic bytes before processing.
 */
export function isAllowedScormMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return true;

  return (ALLOWED_SCORM_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Question Type Constants
 * These match canonical question type ids.
 */
export const QUESTION_TYPE = QUESTION_TYPE_IDS;
