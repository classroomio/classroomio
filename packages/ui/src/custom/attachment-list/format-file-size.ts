export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';

  const unit = 1024;
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(unit)), units.length - 1);
  const value = bytes / Math.pow(unit, unitIndex);

  return `${parseFloat(value.toFixed(2))} ${units[unitIndex]}`;
}
