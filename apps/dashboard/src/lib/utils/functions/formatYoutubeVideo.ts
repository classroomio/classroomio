import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';
import { snackbar } from '$lib/components/Snackbar/store';

export function formatYoutubeVideo(url: string, errors: Record<string, string>) {
  console.log(`url`, url);
  const prefix = 'https://www.youtube.com/embed';

  // https://www.youtube.com/embed/qajK1J1neAM
  if (url.includes('embed')) {
    return url;
  }

  // https://youtu.be/qajK1J1neAM
  if (url.includes('.be/')) {
    const splittedUrlWithBe = url.split('.be/');

    return `${prefix}/${splittedUrlWithBe[1]}`;
  }

  // https://www.youtube.com/watch?v=qajK1J1neAM
  const splitedUrl = url.split('watch');
  if (splitedUrl.length !== 2) {
    errors.video = 'Not a valid youtube link';
    return;
  }

  const query = new URLSearchParams(splitedUrl[1]);

  return `${prefix}/${query.get('v')}`;
}

export function getEmbedId(url: string) {
  // https://www.youtube.com/embed/qajK1J1neAM
  if (url.includes('embed')) {
    return url.split('embed/')[1];
  }

  // https://youtu.be/qajK1J1neAM
  if (url.includes('.be/')) {
    const splittedUrlWithBe = url.split('.be/');

    return splittedUrlWithBe[1];
  }

  // https://www.youtube.com/watch?v=qajK1J1neAM
  const splitedUrl = url.split('watch');
  if (splitedUrl.length !== 2) {
    return '';
  }

  const query = new URLSearchParams(splitedUrl[1]);

  return query.get('v');
}

export function getVideoUrls(urls = '') {
  return (urls || '').split(',').filter((url) => !!url.trim());
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    snackbar.success('Copied to clipboard');
  } catch (err) {
    console.error('Failed to copy:', err);
    snackbar.error('Failed to copy');
  }
}

export function removeVideo(index = 0) {
  lesson.update((currentLesson) => ({
    ...currentLesson,
    materials: {
      ...currentLesson.materials,
      videos: currentLesson.materials.videos.filter((_v, i) => i !== index)
    }
  }));
}
