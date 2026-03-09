import { classroomio } from '$lib/utils/services/api';
import { generateVideoThumbnail } from './video-thumbnail-utils';

export type VideoThumbnailUploadResult = { url: string; durationSeconds: number };

/**
 * Handles media uploads (e.g. video thumbnails) via the media API.
 */
export class MediaUploader {
  /**
   * Generates a thumbnail from the video file and uploads it to the media bucket.
   * Returns the public thumbnail URL and video duration, or null if generation or upload fails.
   */
  async uploadVideoThumbnail(videoFile: File): Promise<VideoThumbnailUploadResult | null> {
    const thumbnailResult = await generateVideoThumbnail(videoFile);
    if (!thumbnailResult) return null;

    const thumbnailFileName = videoFile.name.replace(/\.[^.]+$/, '') + '-thumbnail.jpg';
    const file = new File([thumbnailResult.blob], thumbnailFileName, { type: 'image/jpeg' });

    try {
      const response = await classroomio.media.image.$post({ form: { file } });
      const data = await response.json();
      if (!data.success || !data.url) return null;
      return {
        url: data.url,
        durationSeconds: thumbnailResult.durationSeconds
      };
    } catch {
      return null;
    }
  }
}
