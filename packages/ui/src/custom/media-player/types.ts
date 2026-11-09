import type Plyr from 'plyr';

export type VideoType = 'youtube' | 'vimeo' | 'generic' | 'upload' | 'muse' | 'google_drive';

export interface VideoTextTrack {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
  kind?: 'captions' | 'subtitles';
}

/**
 * Result of minting the HLS playback cookie. `expiresInSeconds` lets the
 * player renew the cookie before it lapses; `authExpired` means the
 * viewer's session is gone and they must sign in again.
 */
export interface HlsCookieGrant {
  authExpired?: boolean;
  expiresInSeconds?: number;
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
  /** Whether the viewer is a learner (controls user-facing error copy). */
  isLearnerView?: boolean;
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
  playbackAuthErrorLabel?: string;
  playbackAuthActionLabel?: string;
  onPlaybackAuthRequired?: () => void;
  /** Fires after a new `src` finishes loading metadata (used to restore seek position). */
  onSourceLoaded?: (video: HTMLVideoElement) => void;
  /**
   * HTML5 playback only: where a returning viewer left off. The player loads
   * just enough media to show this position on the progress bar before the
   * first play. Ignored once playback has started.
   */
  resumeAtSeconds?: number;
  /** Label overrides for Vimeo privacy restriction errors */
  vimeoPrivacyErrorTitle?: string;
  vimeoPrivacyErrorDescription?: string;
  vimeoPrivacyErrorUnlistedHint?: string;
  vimeoPrivacyErrorDomainPrefix?: string;
  vimeoPrivacyErrorDomainSuffix?: string;
  vimeoPrivacyErrorOtherHint?: string;
  vimeoPrivacyErrorPrefix?: string;
  vimeoPrivacyErrorSuffix?: string;
  vimeoRetryLabel?: string;
  vimeoLearnerErrorTitle?: string;
  vimeoLearnerErrorDescription?: string;
  /**
   * HTML5 playback only (not YouTube/embed): adds a control-bar button after Plyr inits.
   * Use for actions like reopening a transcript side panel without toggling on-video captions.
   */
  transcriptPanelControl?: {
    label: string;
    onClick: () => void;
  };
  /**
   * For HLS sources only. Mints the short-lived signed cookie that the
   * tenant-router Worker validates when serving segments in Cloud
   * production. Called before the manifest loads, again shortly before
   * `expiresInSeconds` elapses, and when a playlist or segment request is
   * rejected as unauthorized; a call that throws is retried a few times.
   * Locally / self-hosted this is typically a no-op or a best-effort call
   * that fails benignly.
   */
  onBeforeHlsLoad?: () => Promise<HlsCookieGrant | void>;
  seekPolicy?: {
    mode: 'locked_until_complete';
    watchThresholdPercent: number;
    initialFurthestSeconds?: number;
    pauseOnHidden?: boolean;
    onProgress?: (payload: { positionSeconds: number; playedDeltaSeconds: number; durationSeconds: number }) => void;
    onSeekBlocked?: () => void;
  };
}
