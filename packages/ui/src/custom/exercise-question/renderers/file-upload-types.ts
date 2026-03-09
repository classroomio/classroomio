export const FILE_UPLOAD_MAX_SIZE_MB = 2;

export const FILE_UPLOAD_SUPPORTED_TYPES = [
  { value: 'application/pdf', label: 'PDF (.pdf)', aliases: ['pdf', '.pdf'] },
  {
    value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'DOCX (.docx)',
    aliases: ['docx', '.docx']
  },
  { value: 'application/msword', label: 'DOC (.doc)', aliases: ['doc', '.doc'] },
  { value: 'image/jpeg', label: 'JPEG (.jpg, .jpeg)', aliases: ['jpg', '.jpg', 'jpeg', '.jpeg', 'image/jpg'] },
  { value: 'image/png', label: 'PNG (.png)', aliases: ['png', '.png'] },
  { value: 'image/webp', label: 'WEBP (.webp)', aliases: ['webp', '.webp'] },
  { value: 'image/gif', label: 'GIF (.gif)', aliases: ['gif', '.gif'] },
  { value: 'video/mp4', label: 'MP4 (.mp4)', aliases: ['mp4', '.mp4'] },
  { value: 'video/quicktime', label: 'MOV (.mov)', aliases: ['mov', '.mov'] },
  { value: 'video/x-msvideo', label: 'AVI (.avi)', aliases: ['avi', '.avi'] },
  { value: 'video/x-matroska', label: 'MKV (.mkv)', aliases: ['mkv', '.mkv'] }
] as const;

type SupportedType = (typeof FILE_UPLOAD_SUPPORTED_TYPES)[number];
const SUPPORTED_TYPE_BY_VALUE = new Map<string, SupportedType>(
  FILE_UPLOAD_SUPPORTED_TYPES.map((entry) => [entry.value, entry])
);

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function toCanonicalAcceptedType(value: string): string | null {
  const normalizedValue = normalizeToken(value);
  if (!normalizedValue) return null;

  if (SUPPORTED_TYPE_BY_VALUE.has(normalizedValue)) {
    return normalizedValue;
  }

  for (const fileType of FILE_UPLOAD_SUPPORTED_TYPES) {
    if (fileType.aliases.some((alias) => normalizeToken(alias) === normalizedValue)) {
      return fileType.value;
    }
  }

  return null;
}

export function normalizeAcceptedFileTypes(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawValue of rawValues) {
    if (typeof rawValue !== 'string') continue;

    const canonicalValue = toCanonicalAcceptedType(rawValue);
    if (!canonicalValue || seen.has(canonicalValue)) continue;

    seen.add(canonicalValue);
    normalized.push(canonicalValue);
  }

  return normalized;
}

export function formatAcceptedFileTypes(values: string[]): string {
  return values
    .map((value) => SUPPORTED_TYPE_BY_VALUE.get(value)?.label ?? value)
    .filter(Boolean)
    .join(', ');
}

function getFileExtension(filename: string): string | null {
  const extensionSeparatorIndex = filename.lastIndexOf('.');
  if (extensionSeparatorIndex < 0) return null;
  return normalizeToken(filename.slice(extensionSeparatorIndex));
}

export function isFileTypeAllowed(file: File, acceptedTypes: string[]): boolean {
  if (acceptedTypes.length === 0) return true;

  const fileMimeType = normalizeToken(file.type);
  const fileExtension = getFileExtension(file.name);
  const fileExtensionWithoutDot = fileExtension ? fileExtension.slice(1) : null;

  for (const acceptedType of acceptedTypes) {
    const supportedType = SUPPORTED_TYPE_BY_VALUE.get(acceptedType);
    if (!supportedType) continue;

    if (fileMimeType === supportedType.value) return true;

    if (fileMimeType === 'image/jpg' && supportedType.value === 'image/jpeg') return true;

    if (
      fileExtension &&
      supportedType.aliases.some((alias) => {
        const normalizedAlias = normalizeToken(alias);
        return normalizedAlias === fileExtension || normalizedAlias === fileExtensionWithoutDot;
      })
    ) {
      return true;
    }
  }

  return false;
}

const BYTES_PER_MB = 1024 * 1024;

export function isFileSizeAllowed(file: File, maxSizeMb: number | undefined | null): boolean {
  const effectiveMaxMb = Math.min(
    typeof maxSizeMb === 'number' && maxSizeMb > 0 ? maxSizeMb : FILE_UPLOAD_MAX_SIZE_MB,
    FILE_UPLOAD_MAX_SIZE_MB
  );
  return file.size <= effectiveMaxMb * BYTES_PER_MB;
}
