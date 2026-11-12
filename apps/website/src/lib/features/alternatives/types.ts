import type { CompetitorSlug } from './navigation';

export type { CompetitorSlug };

export interface Competitor {
  name: string;
  kind: string;
  angle: string;
  blurb: string;
}

export type HeroFrame = 'window' | 'panel' | 'bare' | 'portrait' | 'photo';
export type HeroLayout = 'cascade' | 'mirror' | 'column' | 'ledge' | 'spotlight';
export type HeroCanvas = 'grid' | 'dots' | 'rings' | 'glow' | 'lines';
export type HeroTone = 'mint' | 'lavender' | 'sky';

export interface HeroStage {
  anchor?: string;
  floats?: string[];
  layout?: HeroLayout;
  canvas?: HeroCanvas;
  frame?: HeroFrame;
  person?: string;
  people?: string[];
  tone?: HeroTone;
  course?: string;
  lessons?: number;
  lesson?: string;
  path?: string;
  note?: string;
}

export interface PickCard {
  title: string;
  points: string[];
}

export interface PageContent {
  seo: {
    title: string;
    meta: string;
  };
  headline: string;
  mark: string;
  sub: string;
  cta: {
    primary: [string, string];
    secondary: [string, string];
  };
  chips: string[];
  pick: {
    lead: string;
    them: PickCard;
    us: PickCard;
  };
  hero: HeroStage;
  features: {
    eyebrow?: string;
    title: string;
    lead: string;
    items: Array<{
      key: string;
      title?: string;
      text?: string;
    }>;
  };
  showcase: {
    eyebrow: string;
    title: string;
    text: string;
    points: string[];
    viz: string;
  };
  compare: {
    title: string;
    lead: string;
  };
}

export interface FeatureDefinition {
  icon: string;
  title: string;
  text: string;
  viz: string;
}

export interface SharedContent {
  move: {
    title: string;
    sub: string;
    items: Array<[string, string]>;
  };
  intro: {
    eyebrow?: string;
    title: string;
    steps: Array<[string, string]>;
    viz: string;
  };
  features: {
    eyebrow?: string;
    title: string;
    lead: string;
    items: Array<{
      key: string;
      title?: string;
      text?: string;
    }>;
  };
  showcase: {
    eyebrow: string;
    title: string;
    text: string;
    points: string[];
    viz: string;
  };
  plans: {
    eyebrow: string;
    title: string;
    lead: string;
    us: {
      name: string;
      price: string;
      unit: string;
      text: string;
      foot: string;
      link: [string, string];
    };
  };
  faq: Array<[string, string]>;
}

export interface PriceCard {
  price: string;
  unit?: string;
  text: string;
}

export interface AlternativesContent {
  checked: string;
  slugs: CompetitorSlug[];
  competitors: Record<CompetitorSlug, Competitor>;
  features: Record<string, FeatureDefinition>;
  shared: SharedContent;
  cards: Record<CompetitorSlug, PriceCard>;
  pricingUrls: Record<CompetitorSlug, string>;
  pages: Record<CompetitorSlug, PageContent>;
}
