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
  /**
   * When true, `url` is treated as an HLS master playlist (.m3u8). The
   * player attaches hls.js (or uses native HLS on Safari) instead of
   * setting the URL directly on the `<video>` element.
   */
  hls?: boolean;
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
  /** Shown when the media element fails to load or decode. */
  playbackErrorLabel?: string;
  /** Accessible label for the loading/buffering spinner overlay. */
  loadingLabel?: string;
  /** Label for the manual reload control shown after a playback failure. */
  playbackReloadLabel?: string;
  /** Fetch a fresh playback URL (or otherwise prepare a retry). Return true to retry loading. */
  onPlaybackReload?: () => boolean | Promise<boolean>;
  /** Fires after a new `src` finishes loading metadata (used to restore seek position). */
  onSourceLoaded?: (video: HTMLVideoElement) => void;
  /**
   * HTML5 playback only (not YouTube/embed): adds a control-bar button after Plyr inits.
   * Use for actions like reopening a transcript side panel without toggling on-video captions.
   */
  transcriptPanelControl?: {
    label: string;
    onClick: () => void;
  };
  /**
   * For HLS sources only. Invoked before hls.js (or native HLS) loads the
   * manifest. Use it to mint a short-lived signed cookie that the
   * tenant-router Worker validates when serving segments in Cloud
   * production. Locally / self-hosted this is typically a no-op or a
   * best-effort call that fails benignly.
   */
  onBeforeHlsLoad?: () => Promise<void>;
  seekPolicy?: {
    mode: 'locked_until_complete';
    watchThresholdPercent: number;
    initialFurthestSeconds?: number;
    pauseOnHidden?: boolean;
    onProgress?: (payload: { positionSeconds: number; playedDeltaSeconds: number; durationSeconds: number }) => void;
    onSeekBlocked?: () => void;
  };
}
