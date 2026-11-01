export type FileBadge = {
  label: string;
};

const MAX_LABEL_LENGTH = 5;

function getExtension(fileName: string): string {
  const separatorIndex = fileName.lastIndexOf('.');
  if (separatorIndex < 0) return '';

  return fileName.slice(separatorIndex + 1).toLowerCase();
}

export function getFileBadge(fileName: string): FileBadge {
  const extension = getExtension(fileName);
  const label = (extension || 'file').slice(0, MAX_LABEL_LENGTH).toUpperCase();

  return { label };
}
