export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Video frames are dark regardless of app theme, so the letterbox and captions use fixed contrast colours. */
export const VIDEO_COLORS = {
  letterbox: '#000000',
  captionText: '#FFFFFF',
  captionBackground: 'rgba(0, 0, 0, 0.72)'
} as const;
