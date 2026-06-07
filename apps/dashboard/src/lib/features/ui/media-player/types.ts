export type VideoType = 'youtube' | 'generic' | 'upload' | 'muse' | 'google_drive';

export interface VideoSource {
  type: VideoType;
  url: string;
  /**
   * When set, `url` points at an HLS master playlist (.m3u8). The player
   * attaches hls.js instead of feeding the URL into a raw HTML5 video.
   */
  hls?: boolean;
  metadata?: {
    svid?: string; // muse.ai video ID
    thumbnailUrl?: string; // upload thumbnail / poster
    title?: string;
  };
}

export interface MediaPlayerOptions {
  autoplay?: boolean;
  controls?: boolean;
  maxHeight?: number | string;
  minHeight?: number | string;
  width?: number | string;
  height?: number | string;
  class?: string;
  playsinline?: boolean;
}
