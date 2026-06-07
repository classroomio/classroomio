const DEFAULT_SEEK_SECONDS = 1;
const THUMBNAIL_TIMEOUT_MS = 15_000;
/** Cap the captured frame to this width so the preview matches the stored thumbnail. */
const MAX_THUMBNAIL_WIDTH = 1280;
/** Hard ceiling for the generated thumbnail (matches the server job). */
const THUMBNAIL_MAX_BYTES = 500 * 1024;
/** JPEG quality steps tried (best first) until the frame fits under the size cap. */
const THUMBNAIL_QUALITY_LADDER = [0.9, 0.8, 0.7, 0.6, 0.5];

export type ThumbnailResult = { blob: Blob; durationSeconds: number };

/**
 * Encode the canvas as JPEG, stepping quality down until the blob fits under
 * `maxBytes`. Resolves with the first blob within the cap, the smallest one
 * produced if none fit, or null on failure.
 */
function canvasToJpegBlobUnderCap(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    let smallest: Blob | null = null;
    let index = 0;

    const tryNext = () => {
      if (index >= THUMBNAIL_QUALITY_LADDER.length) {
        resolve(smallest);
        return;
      }

      const quality = THUMBNAIL_QUALITY_LADDER[index];
      index += 1;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (!smallest || blob.size < smallest.size) smallest = blob;
            if (blob.size <= maxBytes) {
              resolve(blob);
              return;
            }
          }
          tryNext();
        },
        'image/jpeg',
        quality
      );
    };

    tryNext();
  });
}

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
        if (video.videoWidth <= 0 || video.videoHeight <= 0) {
          finish(null);
          return;
        }

        const scale = video.videoWidth > MAX_THUMBNAIL_WIDTH ? MAX_THUMBNAIL_WIDTH / video.videoWidth : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const durationSeconds = video.duration;
        canvasToJpegBlobUnderCap(canvas, THUMBNAIL_MAX_BYTES).then((blob) => {
          if (blob) {
            finish({ blob, durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0 });
          } else {
            finish(null);
          }
        });
      } catch {
        finish(null);
      }
    });

    video.load();
  });
}
