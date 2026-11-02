export const LANDING_PAGE_TEMPLATE_IDS = ['bootcamp', 'creator', 'modern', 'minimal'] as const;
export type LandingPageTemplateId = (typeof LANDING_PAGE_TEMPLATE_IDS)[number];

export const LANDING_PAGE_FONT_FAMILIES = [
  'inter',
  'roboto',
  'outfit',
  'playfair',
  'plus-jakarta-sans',
  'space-grotesk',
  'system'
] as const;
export type LandingPageFontFamily = (typeof LANDING_PAGE_FONT_FAMILIES)[number];

export interface LandingPageCustomLink {
  id: string;
  label: string;
  href: string;
}

export interface LandingPageTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: LandingPageFontFamily;
}

export interface LandingPageNavigation {
  showLogo: boolean;
  showAuthAction: boolean;
  customLinks: LandingPageCustomLink[];
}

export interface LandingPageHero {
  badge?: string;
  headline: string;
  subheadline: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  mediaType: 'image' | 'none';
  mediaUrl?: string;
}

export interface LandingPageFeatureItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
}

export interface LandingPageFeaturesSection {
  id: string;
  type: 'features';
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: LandingPageFeatureItem[];
}

export interface LandingPageCoursesSection {
  id: string;
  type: 'courses';
  enabled: boolean;
  title: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  maxItems?: number;
}

export interface LandingPageTestimonialItem {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  quote: string;
  rating?: number;
}

export interface LandingPageTestimonialsSection {
  id: string;
  type: 'testimonials';
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: LandingPageTestimonialItem[];
}

export interface LandingPageFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LandingPageFaqSection {
  id: string;
  type: 'faq';
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: LandingPageFaqItem[];
}

export interface LandingPageCtaSection {
  id: string;
  type: 'cta';
  enabled: boolean;
  title: string;
  description?: string;
  action: {
    label: string;
    href: string;
  };
}

export interface LandingPageStatItem {
  id: string;
  label: string;
  value: string;
}

export interface LandingPageStatsSection {
  id: string;
  type: 'stats';
  enabled: boolean;
  title?: string;
  subtitle?: string;
  items: LandingPageStatItem[];
}

export type LandingPageSectionV1 =
  | LandingPageFeaturesSection
  | LandingPageCoursesSection
  | LandingPageTestimonialsSection
  | LandingPageFaqSection
  | LandingPageCtaSection
  | LandingPageStatsSection;

export interface LandingPageFooter {
  copyrightText?: string;
  links: LandingPageCustomLink[];
}

export interface LandingPageDocumentV1 {
  schema: 'classroomio.landing-page';
  version: 1;
  templateId: LandingPageTemplateId;
  seo: {
    title?: string;
    description?: string;
    socialImageUrl?: string;
  };
  theme: LandingPageTheme;
  navigation: LandingPageNavigation;
  hero: LandingPageHero;
  sections: LandingPageSectionV1[];
  footer: LandingPageFooter;
}

export interface LandingPagePluginSource {
  kind: 'plugin';
  pluginId: string;
  installationId: string;
  pluginVersion: string;
  templateSourceId?: string;
  templateName?: string;
}

export interface LandingPagePresentationV1 {
  kind: 'document';
  schema: 'classroomio.landing-page';
  version: 1;
  source: LandingPagePluginSource;
  document: LandingPageDocumentV1;
  revision: number;
  publishedAt: string;
  publishedBy: string;
}

export interface LandingPageCourse {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  image?: string | null;
  isPricing?: boolean;
  cost?: number | null;
  currency?: string | null;
  totalLessons?: number;
}

export interface LandingPageAuth {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
  action?: {
    label: string;
    href: string;
  };
}

export interface LandingPageOrganization {
  id: string;
  name: string;
  logoUrl?: string | null;
  slug: string;
}

export interface LandingPageRenderData {
  organization: LandingPageOrganization;
  courses: LandingPageCourse[];
  auth: LandingPageAuth;
}

export interface LandingPageRenderResult {
  html: string;
  css: string;
  fontsHref?: string;
  meta: {
    title: string;
    description?: string;
    socialImageUrl?: string;
  };
}

export interface LandingPageTemplateDefinition {
  id: LandingPageTemplateId;
  name: string;
  description: string;
  document: LandingPageDocumentV1;
}
