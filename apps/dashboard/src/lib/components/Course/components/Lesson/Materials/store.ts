import { apiClient } from '$lib/utils/services/api';
import { writable } from 'svelte/store';

export const signedVideoUrls = writable({});

export async function retrieveVideos(videoFiles) {
  const videoFileNames = videoFiles
    .filter((video) => video.type === 'muse')
    .map((video) => video.videoKey);

  if (!videoFileNames || videoFileNames.length === 0) return;

  try {
    const response = await apiClient.post('/getVideoDownloadUrls', {
      fileNames: videoFileNames
    });

    signedVideoUrls.set(response.data.urls);
  } catch (error) {
    console.error('Error retrieving videos:', error);
    return null;
  }
}
