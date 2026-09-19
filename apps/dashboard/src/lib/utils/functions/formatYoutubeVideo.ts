import { lessonApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import { getYoutubeVideoId, formatYoutubeEmbedUrl, splitLinks } from '@cio/utils';

/**
 * Validates and formats a YouTube URL into an embed URL.
 *
 * If invalid, sets an i18n translation key (not a plain error string) on
 * `errors.video` to be resolved by the caller with `$t(...)`.
 *
 * @param url - YouTube URL to validate and format
 * @param errors - Mutable error record receiving the translation key on failure
 * @returns Embed URL or `undefined` if invalid
 */
export function formatYoutubeVideo(url: string, errors: Record<string, string>): string | undefined {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    errors.video = 'course.navItem.lessons.materials.tabs.video.add_video.invalid_youtube';
    return;
  }

  return formatYoutubeEmbedUrl(url);
}

export function getEmbedId(url: string): string {
  return getYoutubeVideoId(url) ?? '';
}

export function getVideoUrls(urls = ''): string[] {
  return splitLinks(urls);
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    snackbar.success('snackbar.people.success.copied');
  } catch (err) {
    console.error('Failed to copy:', err);
    snackbar.error('snackbar.public_course.url_copy_failed');
  }
}

export function removeVideo(index = 0): void {
  lessonApi.deleteLessonVideo(index);
}
