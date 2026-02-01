export type VideoType = 'youtube' | 'generic' | 'upload' | 'muse';

export interface VideoSource {
  type: VideoType;
  url: string;
  metadata?: {
    svid?: string; // muse.ai video ID
  };
}

export interface MediaPlayerOptions {
  autoplay?: boolean;
  controls?: boolean;
  maxHeight?: number | string;
  width?: number | string;
  height?: number | string;
  class?: string;
  playsinline?: boolean;
}
