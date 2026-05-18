import type { FooterSocialPlatform } from './types';

const KNOWN_PLATFORMS = new Set<FooterSocialPlatform>([
  'instagram',
  'x',
  'linkedin',
  'facebook',
  'youtube',
  'github',
  'tiktok',
  'website'
]);

/** Normalize persisted platform string (e.g. from JSON) to a known platform. */
export function resolveFooterSocialPlatform(value: unknown): FooterSocialPlatform {
  if (typeof value === 'string' && KNOWN_PLATFORMS.has(value as FooterSocialPlatform)) {
    return value as FooterSocialPlatform;
  }

  return 'website';
}

/**
 * If a footer link label matches a known social brand, treat it as a social URL instead of a bottom link.
 */
export function labelMatchesSocialPlatform(label: string): FooterSocialPlatform | null {
  const compact = label
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (compact === 'facebook') return 'facebook';
  if (compact === 'instagram') return 'instagram';
  if (compact === 'twitter' || compact === 'x') return 'x';
  if (compact === 'linkedin') return 'linkedin';
  if (compact === 'youtube') return 'youtube';
  if (compact === 'github' || compact === 'git') return 'github';
  if (compact === 'tiktok') return 'tiktok';

  return null;
}

export const FOOTER_SOCIAL_PLATFORMS = [
  'instagram',
  'x',
  'linkedin',
  'facebook',
  'youtube',
  'github',
  'tiktok',
  'website'
] as const satisfies readonly FooterSocialPlatform[];
