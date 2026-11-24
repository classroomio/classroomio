const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MIN_CONTRAST_AGAINST_WHITE = 3;
const DARKEN_STEP = 0.05;

function toRgb(hex: string): [number, number, number] | null {
  const match = hex.trim().match(HEX_PATTERN);
  if (!match) return null;

  const digits = match[1].length === 3 ? match[1].replace(/./g, (char) => char + char) : match[1];
  const value = Number.parseInt(digits, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const scaled = channel / 255;

    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of white text on the given colour. */
export function contrastAgainstWhite(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 0;

  return 1.05 / (relativeLuminance(rgb) + 0.05);
}

/**
 * Normalises a CSS colour to `#rrggbb` and darkens it in 5% steps until white text on it reaches 3:1.
 * Returns null when the value is not a hex colour, and `adjusted` tells whether it had to be darkened.
 */
export function normaliseBrandColour(value: string): { hex: string; adjusted: boolean } | null {
  const rgb = toRgb(value);
  if (!rgb) return null;

  let current = rgb;
  let adjusted = false;

  for (let step = 0; step < 20 && contrastAgainstWhite(toHex(current)) < MIN_CONTRAST_AGAINST_WHITE; step += 1) {
    current = [current[0] * (1 - DARKEN_STEP), current[1] * (1 - DARKEN_STEP), current[2] * (1 - DARKEN_STEP)];
    adjusted = true;
  }

  return { hex: toHex(current), adjusted };
}
