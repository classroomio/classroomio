/**
 * Teammate colours for live cursors and typing previews, indexed by the server's `colorIndex`.
 * Each reads on light and dark backgrounds.
 */
export const REVIEW_PRESENCE_COLORS = [
  'oklch(0.62 0.19 259)',
  'oklch(0.63 0.2 25)',
  'oklch(0.6 0.15 150)',
  'oklch(0.66 0.17 55)',
  'oklch(0.58 0.2 305)',
  'oklch(0.62 0.13 200)',
  'oklch(0.6 0.2 350)',
  'oklch(0.55 0.12 95)'
] as const;

export function getReviewPresenceColor(colorIndex: number): string {
  const count = REVIEW_PRESENCE_COLORS.length;

  return REVIEW_PRESENCE_COLORS[((colorIndex % count) + count) % count];
}

export function getReviewInitials(name: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}
