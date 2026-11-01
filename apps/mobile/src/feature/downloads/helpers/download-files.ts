import { Directory, File, Paths } from 'expo-file-system';

import { DOWNLOADS_FOLDER } from '@/feature/downloads/constants/downloads';
import type { OfflineMediaItem } from '@/feature/downloads/types/downloads';

const MIME_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
};

function hashOf(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function extensionFrom(name: string | null | undefined) {
  const match = name?.split(/[?#]/)[0]?.match(/\.([a-z0-9]{1,5})$/i);

  return match?.[1]?.toLowerCase() ?? null;
}

function extensionOf(item: Pick<OfflineMediaItem, 'kind' | 'url' | 'title' | 'mimeType'>) {
  if (item.mimeType && MIME_EXTENSIONS[item.mimeType]) return MIME_EXTENSIONS[item.mimeType];
  if (item.kind === 'document') return extensionFrom(item.title) ?? extensionFrom(item.url) ?? 'bin';

  return extensionFrom(item.url) ?? (item.kind === 'image' ? 'img' : 'mp4');
}

export function userDownloadsDirectory(userId: string) {
  return new Directory(Paths.document, DOWNLOADS_FOLDER, userId);
}

/** Path of a media file relative to the user's downloads folder. */
export function mediaRelativePath(
  courseId: string,
  lessonId: string,
  item: Pick<OfflineMediaItem, 'key' | 'kind' | 'url' | 'title' | 'mimeType'>
) {
  return `${courseId}/${lessonId}/${item.kind}-${hashOf(item.key)}.${extensionOf(item)}`;
}

export function downloadedFile(userId: string, relativePath: string) {
  return new File(userDownloadsDirectory(userId), relativePath);
}

export function lessonDirectory(userId: string, courseId: string, lessonId: string) {
  return new Directory(userDownloadsDirectory(userId), courseId, lessonId);
}

export function courseDirectory(userId: string, courseId: string) {
  return new Directory(userDownloadsDirectory(userId), courseId);
}

export function deleteDirectory(directory: Directory) {
  try {
    if (directory.exists) directory.delete();
  } catch {}
}

export function deleteFile(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {}
}

export function availableDiskSpace() {
  try {
    return Paths.availableDiskSpace;
  } catch {
    return null;
  }
}
