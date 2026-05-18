import type Plyr from 'plyr';

export type VideoType = 'youtube' | 'generic' | 'upload' | 'muse' | 'google_drive';

export interface VideoTextTrack {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
  kind?: 'captions' | 'subtitles';
}

export interface VideoSource {
  type: VideoType;
  url: string;
  metadata?: {
    svid?: string;
    thumbnailUrl?: string;
    title?: string;
  };
  tracks?: VideoTextTrack[];
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
  /** Fires on HTML5 timeupdate (seconds). */
  onTimeUpdate?: (seconds: number) => void;
  /** Fires the first time playback transitions to playing in this player session. */
  onFirstPlay?: () => void;
  /** After Plyr is constructed (seek via `player.currentTime = n`). */
  onPlayerReady?: (player: Plyr) => void;
  /**
   * HTML5 playback only (not YouTube/embed): adds a control-bar button after Plyr inits.
   * Use for actions like reopening a transcript side panel without toggling on-video captions.
   */
  transcriptPanelControl?: {
    label: string;
    onClick: () => void;
  };
}
