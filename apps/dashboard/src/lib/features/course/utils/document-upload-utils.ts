import type { DocumentUploadItem } from './types';

export const MAX_DOCUMENT_UPLOAD_FILES = 10;
export const MAX_CONCURRENT_DOCUMENT_UPLOADS = 3;

const BYTES_PER_KB = 1024;
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];

const FILE_BADGE_COLORS: Record<string, string> = {
  pdf: 'bg-red-500',
  doc: 'bg-blue-600',
  docx: 'bg-blue-600',
  csv: 'bg-emerald-600',
  xlsx: 'bg-emerald-600',
  ipynb: 'bg-orange-500',
  py: 'bg-sky-600'
};

export function formatUploadFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB)), SIZE_UNITS.length - 1);
  const value = bytes / BYTES_PER_KB ** unitIndex;
  const fractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;

  return `${value.toFixed(fractionDigits)} ${SIZE_UNITS[unitIndex]}`;
}

export function getFileExtension(fileName: string): string {
  const separatorIndex = fileName.lastIndexOf('.');
  if (separatorIndex < 0) return '';

  return fileName.slice(separatorIndex + 1).toLowerCase();
}

export function getFileBadge(fileName: string): { label: string; colorClass: string } {
  const extension = getFileExtension(fileName);

  return {
    label: (extension || 'file').slice(0, 5).toUpperCase(),
    colorClass: FILE_BADGE_COLORS[extension] ?? 'bg-slate-500'
  };
}

export function getUploadedBytes(item: Pick<DocumentUploadItem, 'file' | 'progress'>): number {
  return Math.round((item.file.size * item.progress) / 100);
}
