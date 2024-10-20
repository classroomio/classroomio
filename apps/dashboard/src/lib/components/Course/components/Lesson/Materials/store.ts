import { writable } from 'svelte/store';
import { env } from '$env/dynamic/public';
import axios from 'axios';

export const signedVideoUrls = writable({});

export async function retrieveVideos(videoFiles) {
  const videoFileNames = videoFiles
    .filter((video) => video.type === 'muse')
    .map((video) => video.videoKey);

  if (!videoFileNames || videoFileNames.length === 0) return;

  try {
    const response = await axios.post(`${env.PUBLIC_SERVER_URL}/getVideoDownloadUrls`, {
      fileNames: videoFileNames
    });

    signedVideoUrls.set(response.data.urls);
  } catch (error) {
    console.error('Error retrieving videos:', error);
    return null;
  }
}
