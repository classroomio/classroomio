const JPEG_QUALITY = 0.85;
const DEFAULT_SEEK_SECONDS = 1;
const THUMBNAIL_TIMEOUT_MS = 15_000;

export type ThumbnailResult = { blob: Blob; durationSeconds: number };

/**
 * Generates a thumbnail from a video file by capturing a frame to canvas.
 * Seeks to 1s or duration/4 for short clips. Returns null on failure.
 */
export function generateVideoThumbnail(videoFile: File): Promise<ThumbnailResult | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(null);
    }, THUMBNAIL_TIMEOUT_MS);

    const finish = (result: ThumbnailResult | null) => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(result);
    };

    video.addEventListener('error', () => finish(null));
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const seekTo = !Number.isFinite(duration) || duration <= 0 ? 0 : Math.min(DEFAULT_SEEK_SECONDS, duration / 4);
      video.currentTime = seekTo;
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width <= 0 || canvas.height <= 0) {
          finish(null);
          return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const durationSeconds = video.duration;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              finish({ blob, durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0 });
            } else {
              finish(null);
            }
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      } catch {
        finish(null);
      }
    });

    video.load();
  });
}
