export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export const SKIP_SECONDS = 10;

/** Video frames are dark regardless of app theme, so everything drawn over them uses fixed contrast colours. */
export const VIDEO_COLORS = {
  letterbox: '#000000',
  captionText: '#FFFFFF',
  captionBackground: 'rgba(0, 0, 0, 0.72)',
  control: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.42)',
  controlBackground: 'rgba(0, 0, 0, 0.4)',
  controlPressed: 'rgba(255, 255, 255, 0.16)',
  track: 'rgba(255, 255, 255, 0.28)',
  buffered: 'rgba(255, 255, 255, 0.5)'
} as const;
