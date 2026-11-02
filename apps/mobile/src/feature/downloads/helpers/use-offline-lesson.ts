import { lessonHtmlImageUrls, offlineImageKey, replaceLessonHtmlImages } from '@cio/utils/functions/offline-media';
import { useQuery } from '@tanstack/react-query';
import type { File } from 'expo-file-system';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { INLINE_IMAGE_MAX_BYTES } from '@/feature/downloads/constants/downloads';
import { localLessonFiles, storedLesson } from '@/feature/downloads/helpers/download-manager';
import { useLessonDownloadStatus } from '@/feature/downloads/helpers/download-store';

const EMPTY_FILES = new Map<string, File>();

function fingerprint(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `${value.length}:${(hash >>> 0).toString(16)}`;
}

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml'
};

/**
 * The downloaded copy of a lesson: its saved files keyed by media key, and what the manifest stored with it.
 * Reads only the device, so it runs offline.
 */
export function useOfflineLesson(courseId: string, lessonId: string) {
  const { userId } = useAuth();
  const status = useLessonDownloadStatus(courseId, lessonId);
  const downloaded = status === 'complete';

  const local = useQuery({
    queryKey: ['downloads', 'lesson', userId, lessonId],
    queryFn: async () => {
      const [files, stored] = await Promise.all([localLessonFiles(lessonId), storedLesson(lessonId)]);

      return { files, stored };
    },
    enabled: Boolean(userId) && downloaded,
    networkMode: 'always',
    staleTime: Infinity
  });

  if (!downloaded) return { downloaded, ready: true, files: EMPTY_FILES, stored: null };

  return {
    downloaded,
    ready: local.isSuccess || local.isError,
    files: local.data?.files ?? EMPTY_FILES,
    stored: local.data?.stored ?? null
  };
}

async function inlineImages(html: string, files: Map<string, File>) {
  const replacements = new Map<string, string>();

  for (const url of lessonHtmlImageUrls(html)) {
    const file = files.get(offlineImageKey(url));
    if (!file || (file.size ?? 0) > INLINE_IMAGE_MAX_BYTES) continue;

    const extension = file.extension.replace('.', '').toLowerCase();
    const mime = IMAGE_MIME[extension] ?? 'image/png';
    const base64 = await file.base64().catch(() => null);
    if (base64) replacements.set(url, `data:${mime};base64,${base64}`);
  }

  return replaceLessonHtmlImages(html, replacements);
}

export function useOfflineLessonHtml(lessonId: string, html: string | null, files: Map<string, File>) {
  const enabled = Boolean(html) && files.size > 0;
  const inlined = useQuery({
    queryKey: ['downloads', 'lesson-html', lessonId, html ? fingerprint(html) : null, files.size],
    queryFn: () => inlineImages(html!, files),
    enabled,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: 60 * 1000
  });

  if (!enabled) return { html, ready: true };

  return { html: inlined.data ?? (inlined.isError ? html : null), ready: inlined.isSuccess || inlined.isError };
}
