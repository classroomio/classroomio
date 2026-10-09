export const FILE_UPLOAD_SUPPORTED_TYPES = [
  { value: 'application/pdf', label: 'PDF (.pdf)', aliases: ['pdf', '.pdf'] },
  {
    value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'DOCX (.docx)',
    aliases: ['docx', '.docx']
  },
  { value: 'application/msword', label: 'DOC (.doc)', aliases: ['doc', '.doc'] },
  {
    value: 'text/csv',
    label: 'CSV (.csv)',
    aliases: ['csv', '.csv', 'application/csv', 'application/vnd.ms-excel']
  },
  {
    value: 'application/x-ipynb+json',
    label: 'Jupyter Notebook (.ipynb)',
    aliases: ['ipynb', '.ipynb', 'application/json']
  },
  { value: 'image/jpeg', label: 'JPEG (.jpg, .jpeg)', aliases: ['jpg', '.jpg', 'jpeg', '.jpeg', 'image/jpg'] },
  { value: 'image/png', label: 'PNG (.png)', aliases: ['png', '.png'] },
  { value: 'image/webp', label: 'WEBP (.webp)', aliases: ['webp', '.webp'] },
  { value: 'image/gif', label: 'GIF (.gif)', aliases: ['gif', '.gif'] },
  { value: 'video/mp4', label: 'MP4 (.mp4)', aliases: ['mp4', '.mp4'] },
  { value: 'video/quicktime', label: 'MOV (.mov)', aliases: ['mov', '.mov'] },
  { value: 'video/x-msvideo', label: 'AVI (.avi)', aliases: ['avi', '.avi'] },
  { value: 'video/x-matroska', label: 'MKV (.mkv)', aliases: ['mkv', '.mkv'] }
] as const;

export const FILE_UPLOAD_ALLOWED_MIME_TYPES = [
  ...FILE_UPLOAD_SUPPORTED_TYPES.flatMap((fileType) => [
    fileType.value,
    ...fileType.aliases.filter((alias) => alias.includes('/'))
  ])
] as const;

type SupportedType = (typeof FILE_UPLOAD_SUPPORTED_TYPES)[number];
type FileTypeCandidate = { name: string; type: string };

const SUPPORTED_TYPE_BY_VALUE = new Map<string, SupportedType>(
  FILE_UPLOAD_SUPPORTED_TYPES.map((entry) => [entry.value, entry])
);
const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream']);
const EXTENSION_BOUND_MIME_TYPES = new Set(['application/json', 'application/vnd.ms-excel']);

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function getFileExtension(filename: string): string | null {
  const extensionSeparatorIndex = filename.lastIndexOf('.');
  if (extensionSeparatorIndex < 0) return null;

  return normalizeToken(filename.slice(extensionSeparatorIndex));
}

function hasMatchingExtension(filename: string, supportedType: SupportedType): boolean {
  const extension = getFileExtension(filename);
  if (!extension) return false;

  const extensionWithoutDot = extension.slice(1);
  return supportedType.aliases.some((alias) => {
    const normalizedAlias = normalizeToken(alias);
    return normalizedAlias === extension || normalizedAlias === extensionWithoutDot;
  });
}

function hasMatchingMimeType(mimeType: string, supportedType: SupportedType): boolean {
  if (mimeType === supportedType.value) return true;

  return supportedType.aliases.some((alias) => alias.includes('/') && normalizeToken(alias) === mimeType);
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

export function getFileUploadAcceptAttribute(acceptedTypes: string[]): string {
  return acceptedTypes
    .flatMap((acceptedType) => {
      const supportedType = SUPPORTED_TYPE_BY_VALUE.get(acceptedType);
      if (!supportedType) return [];

      const acceptAliases = supportedType.aliases.filter(
        (alias) => alias.startsWith('.') || (alias.includes('/') && !EXTENSION_BOUND_MIME_TYPES.has(alias))
      );
      return [supportedType.value, ...acceptAliases];
    })
    .join(',');
}

export function isFileTypeAllowed(file: FileTypeCandidate, acceptedTypes: string[]): boolean {
  const allowedTypes = acceptedTypes.length > 0 ? acceptedTypes : [...SUPPORTED_TYPE_BY_VALUE.keys()];
  const mimeType = normalizeToken(file.type);
  const fileExtension = getFileExtension(file.name);

  for (const acceptedType of allowedTypes) {
    const supportedType = SUPPORTED_TYPE_BY_VALUE.get(acceptedType);
    if (!supportedType) continue;

    const extensionMatches = hasMatchingExtension(file.name, supportedType);
    if (hasMatchingMimeType(mimeType, supportedType)) {
      if (EXTENSION_BOUND_MIME_TYPES.has(mimeType)) {
        if (extensionMatches) return true;

        continue;
      }

      if (!fileExtension || extensionMatches) return true;

      continue;
    }

    if (GENERIC_MIME_TYPES.has(mimeType) && extensionMatches) return true;
  }

  return false;
}
