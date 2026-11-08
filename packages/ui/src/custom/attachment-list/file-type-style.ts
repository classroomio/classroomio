export type FileTypeStyle = {
  backgroundClass: string;
  iconClass: string;
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

/** Lowercase extension for a MIME type or file name; empty when it cannot be resolved. */
export function getFileExtension(typeOrName: string): string {
  const normalized = typeOrName.trim().toLowerCase();

  if (!normalized) return '';

  const mimeExtension = MIME_TO_EXTENSION[normalized];

  if (mimeExtension) return mimeExtension;

  if (normalized.includes('/')) return '';

  if (normalized.includes('.')) {
    return normalized.split('.').pop() ?? normalized;
  }

  return normalized;
}

export function getFileTypeStyle(typeOrName: string): FileTypeStyle {
  const extension = getFileExtension(typeOrName);

  switch (extension) {
    case 'pdf':
      return {
        backgroundClass: 'ui:bg-destructive/15',
        iconClass: 'ui:text-destructive'
      };
    case 'doc':
    case 'docx':
      return {
        backgroundClass: 'ui:bg-primary/15',
        iconClass: 'ui:text-primary'
      };
    default:
      return {
        backgroundClass: 'ui:bg-muted',
        iconClass: 'ui:text-muted-foreground'
      };
  }
}
