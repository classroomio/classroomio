import { NAMED_THEME_BRANDS } from '@/feature/org/constants/brand-colors';
import type { OrgBrand } from '@/feature/org/types/org';

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function relativeLuminance(hex: string) {
  const expanded = hex.length === 4 ? `#${[...hex.slice(1)].map((digit) => digit + digit).join('')}` : hex;
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(expanded.slice(start, start + 2), 16) / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = channels;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Maps an organization's dashboard theme value to app brand colours, or null for the ClassroomIO default. */
export function orgBrandOf(theme: string | null | undefined): OrgBrand | null {
  const value = theme?.trim() ?? '';
  if (HEX_COLOR.test(value)) {
    return { primary: value, onPrimary: relativeLuminance(value) > 0.45 ? '#0A0A0A' : '#FFFFFF' };
  }

  return NAMED_THEME_BRANDS[value] ?? null;
}
