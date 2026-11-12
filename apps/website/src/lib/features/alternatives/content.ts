import rawContent from './content.json';
import type {
  AlternativesContent,
  Competitor,
  CompetitorSlug,
  FeatureDefinition,
  PageContent,
  PriceCard,
  SharedContent
} from './types';

const content = rawContent as AlternativesContent;

export const CHECKED = content.checked;
export const SLUGS = content.slugs;
export const COMPETITORS = content.competitors;
export const FEATURES = content.features;
export const SHARED = content.shared;
export const CARDS = content.cards;
export const PRICING_URLS = content.pricingUrls;
export const PAGES = content.pages;

export function isCompetitorSlug(value: string): value is CompetitorSlug {
  return (SLUGS as string[]).includes(value);
}

export function getAlternative(slug: string): {
  slug: CompetitorSlug;
  competitor: Competitor;
  page: PageContent;
} | null {
  if (!isCompetitorSlug(slug)) return null;

  return {
    slug,
    competitor: COMPETITORS[slug],
    page: PAGES[slug]
  };
}

export function getRelatedSlugs(slug: CompetitorSlug, count = 3): CompetitorSlug[] {
  const position = SLUGS.indexOf(slug);

  return Array.from({ length: count }, (_, offset) => SLUGS[(position + offset + 1) % SLUGS.length]);
}

export function getFeature(key: string): FeatureDefinition | undefined {
  return FEATURES[key];
}

export function getPriceCard(slug: CompetitorSlug): PriceCard {
  return CARDS[slug];
}

export function getPricingUrl(slug: CompetitorSlug): string {
  return PRICING_URLS[slug];
}

export function getShared(): SharedContent {
  return SHARED;
}
