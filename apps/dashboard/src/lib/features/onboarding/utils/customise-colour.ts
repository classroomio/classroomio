import { getContrast, readableColor } from 'color2k';
import { ONBOARDING_BRAND_PRESETS, type TOnboardingBrandPreset } from '@cio/utils/constants/onboarding';
import type { TOnboardingBrandColour } from '@cio/utils/validation/onboarding';
import type { ColourFormat, RgbColour } from './types';

export const HEX_COLOUR_PATTERN = /^#[0-9a-f]{6}$/i;
export const LOW_CONTRAST_RATIO = 3;

const SHORT_OR_LONG_HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_FUNCTION = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+\s*)?\)$/i;

export const PRESET_PRIMARY: Record<TOnboardingBrandPreset, string> = {
  blue: 'var(--color-blue-700)',
  rose: 'var(--color-rose-600)',
  green: 'var(--color-lime-600)',
  orange: 'var(--color-orange-600)',
  purple: 'var(--color-purple-600)'
};

const PRESET_HEX: Record<TOnboardingBrandPreset, string> = {
  blue: '#1447e6',
  rose: '#ec003f',
  green: '#5ea500',
  orange: '#f54900',
  purple: '#9810fa'
};

const PRESET_FOREGROUND: Record<TOnboardingBrandPreset, string> = {
  blue: 'var(--color-blue-50)',
  rose: 'var(--color-rose-50)',
  green: 'var(--color-lime-50)',
  orange: 'var(--color-orange-50)',
  purple: 'var(--color-purple-50)'
};

export function isBrandPreset(colour: string): colour is TOnboardingBrandPreset {
  return (ONBOARDING_BRAND_PRESETS as readonly string[]).includes(colour);
}

/** Reads a HEX (`#abc`, `#aabbcc`, with or without `#`) or `rgb()` string. Returns null when it is neither. */
export function parseColour(input: string): RgbColour | null {
  const value = input.trim();
  if (!value) return null;

  const hex = value.match(SHORT_OR_LONG_HEX);
  if (hex) {
    const digits = hex[1];
    const full = digits.length === 3 ? [...digits].map((char) => char + char).join('') : digits;

    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16)
    };
  }

  const rgb = value.match(RGB_FUNCTION);
  if (!rgb) return null;

  const channels = [rgb[1], rgb[2], rgb[3]].map(Number);
  if (channels.some((channel) => channel > 255)) return null;

  return { r: channels[0], g: channels[1], b: channels[2] };
}

export function rgbToHex({ r, g, b }: RgbColour): string {
  const pair = (channel: number) => channel.toString(16).padStart(2, '0');

  return `#${pair(r)}${pair(g)}${pair(b)}`;
}

export function formatColour(hex: string, format: ColourFormat): string {
  const parsed = parseColour(hex);
  if (!parsed) return hex;

  return format === 'rgb' ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` : rgbToHex(parsed);
}

export function hasLowContrastOnWhite(hex: string): boolean {
  return HEX_COLOUR_PATTERN.test(hex) && getContrast(hex, '#ffffff') < LOW_CONTRAST_RATIO;
}

export function brandPrimary(colour: TOnboardingBrandColour): string {
  return isBrandPreset(colour) ? PRESET_PRIMARY[colour] : colour;
}

export function brandPrimaryForeground(colour: TOnboardingBrandColour): string {
  return isBrandPreset(colour) ? PRESET_FOREGROUND[colour] : readableColor(colour);
}

/** The sRGB hex of a brand colour, for text fields and the native picker that cannot read a CSS variable. */
export function brandHex(colour: TOnboardingBrandColour): string {
  return isBrandPreset(colour) ? PRESET_HEX[colour] : colour;
}
