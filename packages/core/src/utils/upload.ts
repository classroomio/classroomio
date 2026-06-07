import { nanoid } from 'nanoid';
import path from 'path';

/**
 * Safely extracts the file extension from a filename.
 * Returns an empty string if no extension is found.
 */
export function getExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const ext = path.extname(filename).split('.');
  return ext.length > 1 ? ext[ext.length - 1] : '';
}

export function removeSpacesAndSpecialCharacters(fileName: string): string {
  return fileName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .toLowerCase();
}

/**
 * Generates a unique file key for storage, preserving the file extension.
 * Throws an error if the filename is invalid or has no extension.
 */
export function generateFileKey(fileName: string): string {
  const ext = getExtension(fileName);
  if (!ext) {
    throw new Error('Invalid file name or missing file extension');
  }

  const cleanedFileName = removeSpacesAndSpecialCharacters(fileName);

  return `${nanoid()}-${cleanedFileName}`;
}
