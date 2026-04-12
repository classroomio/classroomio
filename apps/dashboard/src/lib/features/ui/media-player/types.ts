export type VideoType = 'youtube' | 'generic' | 'upload' | 'muse' | 'google_drive';

export interface VideoSource {
  type: VideoType;
  url: string;
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
