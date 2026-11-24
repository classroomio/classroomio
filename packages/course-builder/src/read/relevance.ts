import { brandSlug } from '../discover/brand';

export const RELEVANCE_SAMPLE_SIZE = 5;

const REQUIRED_MENTIONS = 3;
const MIN_NEEDLE_LENGTH = 3;

export class OffBrandSourceError extends Error {
  constructor(readonly url: string) {
    super(`Pages of ${url} do not mention the organisation`);
    this.name = 'OffBrandSourceError';
  }
}

/** Whether enough sampled pages of a source on another domain talk about the organisation in their main content. */
export function isRelevant(samples: string[], brandDomain: string, productNames: string[]): boolean {
  const needles = [brandSlug(brandDomain), ...productNames.map((name) => name.toLowerCase().trim())].filter(
    (needle) => needle.length >= MIN_NEEDLE_LENGTH
  );
  const sampled = samples.slice(0, RELEVANCE_SAMPLE_SIZE);
  const mentions = sampled.filter((text) => {
    const haystack = text.toLowerCase();
    const squashed = haystack.replace(/[^a-z0-9]/g, '');

    return needles.some((needle) => haystack.includes(needle) || squashed.includes(needle.replace(/[^a-z0-9]/g, '')));
  }).length;

  return mentions >= Math.min(REQUIRED_MENTIONS, sampled.length);
}
