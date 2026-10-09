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

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** unitIndex;
  return `${parseFloat(size.toFixed(2))} ${units[unitIndex]}`;
}

export function fileTypeLabel(mimeType: string | undefined): string {
  const mime = mimeType ?? '';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('wordprocessingml') || mime.includes('docx')) return 'DOCX';
  if (mime.includes('msword') || mime.includes('doc')) return 'DOC';
  if (mime.includes('image')) return 'IMAGE';
  if (mime.includes('video')) return 'VIDEO';

  const subtype = mime.split('/')[1]?.toUpperCase();
  return subtype || 'FILE';
}

export function formatUploadedFileSubtitle(mimeType: string | undefined, size: number | undefined): string {
  const parts = [fileTypeLabel(mimeType), size != null ? formatFileSize(size) : null].filter(Boolean);
  return parts.join(' · ') || '–';
}

export function isFileSizeAllowed(
  file: File,
  maxSizeMb: number | undefined | null,
  platformMaxSizeMb: number = FILE_UPLOAD_DEFAULT_MAX_SIZE_MB
): boolean {
  const effectiveMaxMb = resolveExerciseFileUploadMaxSizeMb(maxSizeMb, platformMaxSizeMb);
  return file.size <= effectiveMaxMb * BYTES_PER_MB;
}
