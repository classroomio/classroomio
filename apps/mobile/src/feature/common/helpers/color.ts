function channelsOf(hex: string) {
  const expanded = hex.length === 4 ? `#${[...hex.slice(1)].map((digit) => digit + digit).join('')}` : hex;

  return [1, 3, 5].map((start) => parseInt(expanded.slice(start, start + 2), 16));
}

function toHex(channels: number[]) {
  return `#${channels
    .map((value) =>
      Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`.toUpperCase();
}

/** Mixes a hex colour toward black by `amount` (0–1). */
export function darken(hex: string, amount: number) {
  return toHex(channelsOf(hex).map((value) => value * (1 - amount)));
}

/** A hex colour at `alpha` opacity (0–1), as an 8-digit hex. */
export function withAlpha(hex: string, alpha: number) {
  const suffix = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `${toHex(channelsOf(hex))}${suffix}`;
}

/** Whether a hex colour is light enough that dark content belongs on top of it. */
export function isLightColor(hex: string) {
  const [red = 0, green = 0, blue = 0] = channelsOf(hex);

  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255 > 0.6;
}
