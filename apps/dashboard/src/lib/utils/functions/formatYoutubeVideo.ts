import { lessonApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import { getYoutubeVideoId, formatYoutubeEmbedUrl, splitLinks } from '@cio/utils';

export function formatYoutubeVideo(url: string, errors: Record<string, string>): string | undefined {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    errors.video = 'Not a valid youtube link';
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
