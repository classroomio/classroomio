/** Shared by app.config.ts (native splash) and the animated splash so the hand-off frame matches exactly. */
export const SPLASH = {
  background: '#0233BD',
  glow: '#2F5BE0',
  mark: '#FDFBF7',
  markWidth: 120
} as const;

export const SPLASH_LOCKUP = {
  markWidth: 52,
  gap: 15,
  wordmarkSize: 34
} as const;

export const SPLASH_TIMING = {
  glowIn: 520,
  dotPopDelay: 90,
  dotPop: 170,
  lockupDelay: 280,
  lockup: 420,
  wordmarkDelay: 580,
  wordmark: 320,
  holdUntilExit: 1080,
  exit: 360,
  reducedMotionExit: 220
} as const;
