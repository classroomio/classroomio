import { z } from 'zod';
import {
  LANDING_PAGE_FONT_FAMILIES,
  LANDING_PAGE_TEMPLATE_IDS,
  type LandingPageDocumentV1,
  type LandingPagePresentationV1
} from './types';

const SAFE_PROTOCOL_PATTERN = /^https?:\/\//i;
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function sanitizeHref(url: unknown, fallback = '#'): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  if (SAFE_PROTOCOL_PATTERN.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function sanitizeImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (SAFE_PROTOCOL_PATTERN.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export const ZHexColor = z
  .string()
  .trim()
  .refine((val) => HEX_COLOR_PATTERN.test(val), {
    message: 'Must be a valid hex color code (e.g. #2563eb)'
  });

export const ZLandingPageTemplateId = z.enum(LANDING_PAGE_TEMPLATE_IDS);
export const ZLandingPageFontFamily = z.enum(LANDING_PAGE_FONT_FAMILIES);

export const ZLandingPageCustomLink = z.object({
  id: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(50),
  href: z
    .string()
    .trim()
    .transform((val) => sanitizeHref(val))
});

export const ZLandingPageTheme = z.object({
  primaryColor: ZHexColor,
  secondaryColor: ZHexColor,
  backgroundColor: ZHexColor,
  fontFamily: ZLandingPageFontFamily
});

export const ZLandingPageNavigation = z.object({
  showLogo: z.boolean().default(true),
  showAuthAction: z.boolean().default(true),
  customLinks: z.array(ZLandingPageCustomLink).max(10).default([])
});

export const ZLandingPageHero = z.object({
  badge: z.string().trim().max(50).optional(),
  headline: z.string().trim().min(1).max(150),
  subheadline: z.string().trim().max(600).default(''),
  primaryAction: z.object({
    label: z.string().trim().min(1).max(50),
    href: z
      .string()
      .trim()
      .transform((val) => sanitizeHref(val))
  }),
  secondaryAction: z
    .object({
      label: z.string().trim().min(1).max(50),
      href: z
        .string()
        .trim()
        .transform((val) => sanitizeHref(val))
    })
    .optional(),
  mediaType: z.enum(['image', 'none']).default('none'),
  mediaUrl: z
    .string()
    .trim()
    .optional()
    .transform((val) => sanitizeImageUrl(val))
});

export const ZLandingPageFeatureItem = z.object({
  id: z.string().trim().min(1).max(50),
  icon: z.string().trim().max(50).optional(),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300)
});

export const ZLandingPageFeaturesSection = z.object({
  id: z.string().trim().min(1).max(50),
  type: z.literal('features'),
  enabled: z.boolean().default(true),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300).optional(),
  items: z.array(ZLandingPageFeatureItem).max(12).default([])
});

export const ZLandingPageCoursesSection = z.object({
  id: z.string().trim().min(1).max(50),
  type: z.literal('courses'),
  enabled: z.boolean().default(true),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300).optional(),
  viewAllLabel: z.string().trim().max(50).optional(),
  viewAllHref: z
    .string()
    .trim()
    .transform((val) => sanitizeHref(val))
    .optional(),
  maxItems: z.number().int().min(1).max(24).optional()
});

export const ZLandingPageTestimonialItem = z.object({
  id: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(60),
  role: z.string().trim().max(60).optional(),
  avatarUrl: z
    .string()
    .trim()
    .optional()
    .transform((val) => sanitizeImageUrl(val)),
  quote: z.string().trim().min(1).max(500),
  rating: z.number().int().min(1).max(5).optional()
});

export const ZLandingPageTestimonialsSection = z.object({
  id: z.string().trim().min(1).max(50),
  type: z.literal('testimonials'),
  enabled: z.boolean().default(true),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300).optional(),
  items: z.array(ZLandingPageTestimonialItem).max(12).default([])
});

export const ZLandingPageFaqItem = z.object({
  id: z.string().trim().min(1).max(50),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(1000)
});

export const ZLandingPageFaqSection = z.object({
  id: z.string().trim().min(1).max(50),
  type: z.literal('faq'),
  enabled: z.boolean().default(true),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(300).optional(),
  items: z.array(ZLandingPageFaqItem).max(20).default([])
});

export const ZLandingPageCtaSection = z.object({
  id: z.string().trim().min(1).max(50),
  type: z.literal('cta'),
  enabled: z.boolean().default(true),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  action: z.object({
    label: z.string().trim().min(1).max(50),
    href: z
      .string()
      .trim()
      .transform((val) => sanitizeHref(val))
  })
});

export const ZLandingPageStatItem = z.object({
  id: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(50),
  value: z.string().trim().min(1).max(30)
});

export const ZLandingPageStatsSection = z.object({
  id: z.string().trim().min(1).max(50),
  type: z.literal('stats'),
  enabled: z.boolean().default(true),
  title: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(300).optional(),
  items: z.array(ZLandingPageStatItem).max(8).default([])
});

export const ZLandingPageSectionV1 = z.discriminatedUnion('type', [
  ZLandingPageFeaturesSection,
  ZLandingPageCoursesSection,
  ZLandingPageTestimonialsSection,
  ZLandingPageFaqSection,
  ZLandingPageCtaSection,
  ZLandingPageStatsSection
]);

export const ZLandingPageFooter = z.object({
  copyrightText: z.string().trim().max(100).optional(),
  links: z.array(ZLandingPageCustomLink).max(10).default([])
});

export const ZLandingPageDocumentV1 = z.object({
  schema: z.literal('classroomio.landing-page').default('classroomio.landing-page'),
  version: z.literal(1).default(1),
  templateId: ZLandingPageTemplateId,
  seo: z
    .object({
      title: z.string().trim().max(120).optional(),
      description: z.string().trim().max(300).optional(),
      socialImageUrl: z
        .string()
        .trim()
        .optional()
        .transform((val) => sanitizeImageUrl(val))
    })
    .default({ socialImageUrl: undefined }),
  theme: ZLandingPageTheme,
  navigation: ZLandingPageNavigation,
  hero: ZLandingPageHero,
  sections: z.array(ZLandingPageSectionV1).max(20).default([]),
  footer: ZLandingPageFooter
});

export const ZLandingPagePluginSource = z.object({
  kind: z.literal('plugin').default('plugin'),
  pluginId: z.string().trim().min(1),
  installationId: z.string().uuid(),
  pluginVersion: z.string().trim().min(1),
  templateSourceId: z.string().trim().optional(),
  templateName: z.string().trim().optional()
});

export const ZLandingPagePresentationV1 = z.object({
  kind: z.literal('document').default('document'),
  schema: z.literal('classroomio.landing-page').default('classroomio.landing-page'),
  version: z.literal(1).default(1),
  source: ZLandingPagePluginSource,
  document: ZLandingPageDocumentV1,
  revision: z.number().int().min(1),
  publishedAt: z.string().datetime(),
  publishedBy: z.string().trim().min(1)
});

export function isLandingPageDocumentV1(data: unknown): data is LandingPageDocumentV1 {
  const result = ZLandingPageDocumentV1.safeParse(data);
  return result.success;
}

export function isLandingPagePresentationV1(data: unknown): data is LandingPagePresentationV1 {
  const result = ZLandingPagePresentationV1.safeParse(data);
  return result.success;
}

export function validateLandingPageDocument(data: unknown): {
  success: boolean;
  data?: LandingPageDocumentV1;
  error?: string;
} {
  const result = ZLandingPageDocumentV1.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}

export function validateLandingPagePresentation(data: unknown): {
  success: boolean;
  data?: LandingPagePresentationV1;
  error?: string;
} {
  const result = ZLandingPagePresentationV1.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}
