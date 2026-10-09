export {
  FILE_UPLOAD_SUPPORTED_TYPES,
  formatAcceptedFileTypes,
  getFileUploadAcceptAttribute,
  isFileTypeAllowed,
  normalizeAcceptedFileTypes
} from '@cio/utils/file-upload';

export const FILE_UPLOAD_DEFAULT_MAX_SIZE_MB = 2;
/** @deprecated Use FILE_UPLOAD_DEFAULT_MAX_SIZE_MB */
export const FILE_UPLOAD_MAX_SIZE_MB = FILE_UPLOAD_DEFAULT_MAX_SIZE_MB;

const BYTES_PER_MB = 1024 * 1024;

export function resolveExerciseFileUploadMaxSizeMb(
  questionMaxSizeMb: number | undefined | null,
  platformMaxSizeMb: number = FILE_UPLOAD_DEFAULT_MAX_SIZE_MB
): number {
  const effectivePlatformMax =
    typeof platformMaxSizeMb === 'number' && platformMaxSizeMb > 0
      ? platformMaxSizeMb
      : FILE_UPLOAD_DEFAULT_MAX_SIZE_MB;
  const requestedMax =
    typeof questionMaxSizeMb === 'number' && questionMaxSizeMb > 0 ? questionMaxSizeMb : effectivePlatformMax;

  return Math.min(requestedMax, effectivePlatformMax);
}

export function isFileSizeAllowed(
  file: File,
  maxSizeMb: number | undefined | null,
  platformMaxSizeMb: number = FILE_UPLOAD_DEFAULT_MAX_SIZE_MB
): boolean {
  const effectiveMaxMb = resolveExerciseFileUploadMaxSizeMb(maxSizeMb, platformMaxSizeMb);
  return file.size <= effectiveMaxMb * BYTES_PER_MB;
}
