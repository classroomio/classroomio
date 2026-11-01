export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const;

export const GUTTER = SPACING.lg;

export const RADII = {
  xs: 4,
  sm: 6,
  input: 8,
  md: 10,
  lg: 12,
  xl: 14,
  sheet: 18,
  pill: 999
} as const;

export const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 } as const;

export const ICON_STROKE = 1.8;

export const NOTCH = { width: 46, height: 11, inset: 18 } as const;
