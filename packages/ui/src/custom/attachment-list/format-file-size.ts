export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 Bytes';

  const unit = 1024;
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.max(Math.floor(Math.log(Math.abs(bytes)) / Math.log(unit)), 0), units.length - 1);
  const value = Math.abs(bytes) / Math.pow(unit, unitIndex);

  return `${parseFloat(value.toFixed(2))} ${units[unitIndex]}`;
}
