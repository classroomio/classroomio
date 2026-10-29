export type FileBadge = {
  label: string;
  colorClass: string;
};

const BADGE_COLOR_BY_EXTENSION: Record<string, string> = {
  pdf: 'ui:bg-red-500',
  doc: 'ui:bg-blue-600',
  docx: 'ui:bg-blue-600',
  csv: 'ui:bg-emerald-600',
  xlsx: 'ui:bg-emerald-600',
  ipynb: 'ui:bg-orange-500',
  py: 'ui:bg-sky-600'
};

const DEFAULT_BADGE_COLOR = 'ui:bg-slate-500';
const MAX_LABEL_LENGTH = 5;

function getExtension(fileName: string): string {
  const separatorIndex = fileName.lastIndexOf('.');
  if (separatorIndex < 0) return '';

  return fileName.slice(separatorIndex + 1).toLowerCase();
}

export function getFileBadge(fileName: string): FileBadge {
  const extension = getExtension(fileName);
  const label = (extension || 'file').slice(0, MAX_LABEL_LENGTH).toUpperCase();
  const colorClass = BADGE_COLOR_BY_EXTENSION[extension] ?? DEFAULT_BADGE_COLOR;

  return { label, colorClass };
}
