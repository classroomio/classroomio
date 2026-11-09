import * as z from 'zod';
import { isAllowedHref } from '../shared/safe-href';

export const ZPublicLandingCourse = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    bannerImage: z.string().nullable().optional(),
    isPaid: z.boolean(),
    cost: z.number().optional(),
    currency: z.string().optional(),
    href: z.string()
  })
  .strict();
export type PublicLandingCourse = z.infer<typeof ZPublicLandingCourse>;

export const ZPublicLandingLinkItem = z
  .object({
    label: z.string(),
    href: z.string()
  })
  .strict();
export type PublicLandingLinkItem = z.infer<typeof ZPublicLandingLinkItem>;

export const ZPublicLandingHeroStat = z
  .object({
    label: z.string(),
    value: z.string()
  })
  .strict();
export type PublicLandingHeroStat = z.infer<typeof ZPublicLandingHeroStat>;

export const ZPublicLandingSocialLink = z
  .object({
    platform: z.string(),
    href: z.string()
  })
  .strict();
export type PublicLandingSocialLink = z.infer<typeof ZPublicLandingSocialLink>;

export const ZPublicLandingPageViewModel = z
  .object({
    theme: z.string().trim().min(1),
    templateId: z.string().trim().min(1),
    locale: z.string().trim().min(2).max(35),
    organization: z
      .object({
        id: z.string(),
        name: z.string(),
        siteName: z.string(),
        avatarUrl: z.string().optional()
      })
      .strict(),
    hero: z
      .object({
        heading: z.string(),
        subheading: z.string().optional(),
        eyebrow: z.string().optional(),
        image: z.string().optional(),
        stats: z.array(ZPublicLandingHeroStat).optional(),
        primaryAction: ZPublicLandingLinkItem.optional(),
        secondaryAction: ZPublicLandingLinkItem.optional()
      })
      .strict(),
    navigation: z
      .object({
        navItems: z.array(ZPublicLandingLinkItem),
        signInLabel: z.string().optional(),
        accountLabel: z.string().optional(),
        isAuthenticated: z.boolean().optional()
      })
      .strict()
      .optional(),
    courses: z.array(ZPublicLandingCourse),
    hasMoreCourses: z.boolean(),
    links: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        items: z.array(ZPublicLandingLinkItem),
        cards: z
          .array(
            z
              .object({
                icon: z.string().optional(),
                title: z.string(),
                description: z.string().optional(),
                href: z.string()
              })
              .strict()
          )
          .optional()
      })
      .strict()
      .optional(),
    callout: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        action: ZPublicLandingLinkItem.optional()
      })
      .strict()
      .optional(),
    embed: z
      .object({
        type: z.enum(['youtube', 'vimeo', 'loom', 'custom']),
        url: z.string(),
        aspectRatio: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        secondaryAction: ZPublicLandingLinkItem.optional()
      })
      .strict()
      .optional(),
    footer: z
      .object({
        text: z.string().optional(),
        tagline: z.string().optional(),
        copyright: z.string().optional(),
        links: z.array(ZPublicLandingLinkItem),
        socialLinks: z.array(ZPublicLandingSocialLink),
        columns: z
          .array(
            z
              .object({
                heading: z.string(),
                links: z.array(ZPublicLandingLinkItem)
              })
              .strict()
          )
          .optional()
      })
      .strict()
      .optional()
  })
  .strict();

export type PublicLandingPageViewModel = z.infer<typeof ZPublicLandingPageViewModel>;

/**
 * Sanitizes href values, disallowing dangerous schemes like javascript: or data:.
 */
export function sanitizePublicLandingHref(href: unknown, fallback = '#'): string {
  if (typeof href !== 'string') {
    return fallback;
  }

  const trimmed = href.trim();
  if (!trimmed || !isAllowedHref(trimmed)) {
    return fallback;
  }

  return trimmed;
}

/**
 * Sanitizes and qualifies public landing image URLs.
 */
export function sanitizePublicLandingImage(image: unknown, baseUrl?: string): string | undefined {
  if (typeof image !== 'string') {
    return undefined;
  }

  const trimmed = image.trim();
  if (!trimmed || !isAllowedHref(trimmed)) {
    return undefined;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : undefined);
    if (origin) {
      try {
        return new URL(trimmed, origin).toString();
      } catch {
        return trimmed;
      }
    }
  }

  return trimmed;
}

export interface ProjectPublicLandingPageViewModelParams {
  theme: string;
  templateId: string;
  org: {
    id: string;
    name: string;
    siteName?: string;
    avatarUrl?: string | null;
    locale?: string;
  };
  landingpage?: Record<string, unknown> | null;
  courses?: Array<Record<string, unknown>>;
  hasMoreCourses?: boolean;
  isAuthenticated?: boolean;
  signInLabel?: string;
  accountLabel?: string;
  baseUrl?: string;
}

function inferEmbedType(url: string): 'youtube' | 'vimeo' | 'loom' | 'custom' {
  if (/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)\b/i.test(url)) return 'youtube';
  if (/(^|\.)vimeo\.com\b/i.test(url)) return 'vimeo';
  if (/(^|\.)loom\.com\b/i.test(url)) return 'loom';

  return 'custom';
}

/**
 * Resolves a safe https embed URL from either a direct `url` or the `src` of an author-supplied iframe `code` snippet.
 * Only the URL is extracted; the markup itself is never forwarded to plugins.
 */
function resolvePublicLandingEmbedUrl(rawEmbed: Record<string, unknown>): string | undefined {
  const candidates: string[] = [];

  if (typeof rawEmbed.url === 'string') candidates.push(rawEmbed.url.trim());

  if (typeof rawEmbed.code === 'string') {
    const match = rawEmbed.code.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (match) candidates.push(match[1].trim());
  }

  const normalized = candidates.map((candidate) => (candidate.startsWith('//') ? `https:${candidate}` : candidate));

  return normalized.find((candidate) => /^https:\/\//i.test(candidate) && isAllowedHref(candidate));
}

/**
 * Projects raw organization and landing settings into a minimized, sanitized public view model.
 */
export function projectPublicLandingPageViewModel(
  params: ProjectPublicLandingPageViewModelParams
): PublicLandingPageViewModel {
  const rawLanding = (params.landingpage ?? {}) as Record<string, unknown>;
  const rawHero = (rawLanding.hero ?? {}) as Record<string, unknown>;
  const rawNav = (rawLanding.navigation ?? {}) as Record<string, unknown>;
  const rawLinks = (rawLanding.links ?? {}) as Record<string, unknown>;
  const rawCallout = (rawLanding.callout ?? {}) as Record<string, unknown>;
  const rawEmbed = (rawLanding.embed ?? {}) as Record<string, unknown>;
  const rawFooter = (rawLanding.footer ?? {}) as Record<string, unknown>;

  const eyebrow =
    typeof rawHero.eyebrow === 'string' && rawHero.eyebrow.trim().length > 0 ? rawHero.eyebrow.trim() : undefined;

  const heroImage = sanitizePublicLandingImage(rawHero.image, params.baseUrl);

  const rawStats = Array.isArray(rawHero.stats) ? rawHero.stats : [];
  const heroStats: PublicLandingHeroStat[] = rawStats
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      label: String(item.label ?? '').trim(),
      value: String(item.value ?? '').trim()
    }))
    .filter((item) => item.label.length > 0 && item.value.length > 0);

  const primaryActionRaw = rawHero.primaryAction as Record<string, unknown> | undefined;
  const secondaryActionRaw = rawHero.secondaryAction as Record<string, unknown> | undefined;

  const primaryAction =
    primaryActionRaw && typeof primaryActionRaw.label === 'string'
      ? {
          label: primaryActionRaw.label,
          href: sanitizePublicLandingHref(primaryActionRaw.href, '/courses')
        }
      : undefined;

  const secondaryAction =
    secondaryActionRaw && typeof secondaryActionRaw.label === 'string'
      ? {
          label: secondaryActionRaw.label,
          href: sanitizePublicLandingHref(secondaryActionRaw.href, '#courses')
        }
      : undefined;

  const navItemsRaw = Array.isArray(rawNav.navItems)
    ? rawNav.navItems
    : Array.isArray(rawLanding.navItems)
      ? rawLanding.navItems
      : [];
  const navItems: PublicLandingLinkItem[] = navItemsRaw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      label: String(item.label ?? ''),
      href: sanitizePublicLandingHref(item.href, '#')
    }))
    .filter((item) => item.label.length > 0);

  const rawCourseList = Array.isArray(params.courses) ? params.courses : [];
  const courses: PublicLandingCourse[] = rawCourseList.map((course) => {
    const id = String(course.id ?? '');
    const title = String(course.title ?? '');
    const description = String(course.description ?? '');
    const rawBannerImage = typeof course.bannerImage === 'string' ? course.bannerImage : null;
    const bannerImage = rawBannerImage ? (sanitizePublicLandingImage(rawBannerImage, params.baseUrl) ?? null) : null;
    const isPaid = Boolean(course.isPaid ?? (typeof course.cost === 'number' && course.cost > 0));
    const cost = typeof course.cost === 'number' ? course.cost : undefined;
    const currency = typeof course.currency === 'string' ? course.currency : undefined;
    const slug = typeof course.slug === 'string' && course.slug.length > 0 ? course.slug : id;
    const href = sanitizePublicLandingHref(`/courses/${slug}`, `/courses/${id}`);

    return {
      id,
      title,
      description,
      bannerImage,
      isPaid,
      cost,
      currency,
      href
    };
  });

  const linkCardsRaw = Array.isArray(rawLinks.cards) ? rawLinks.cards : [];
  const linkCards = linkCardsRaw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      icon: typeof item.icon === 'string' ? item.icon : undefined,
      title: String(item.title ?? ''),
      description: typeof item.description === 'string' && item.description.length > 0 ? item.description : undefined,
      href: sanitizePublicLandingHref(item.href, '#')
    }))
    .filter((item) => item.title.length > 0);

  const linksItemsRaw = Array.isArray(rawLinks.items) ? rawLinks.items : [];
  const legacyLinkItems: PublicLandingLinkItem[] = linksItemsRaw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      label: String(item.label ?? ''),
      href: sanitizePublicLandingHref(item.href, '#')
    }))
    .filter((item) => item.label.length > 0);
  const linkItems: PublicLandingLinkItem[] =
    linkCards.length > 0 ? linkCards.map((card) => ({ label: card.title, href: card.href })) : legacyLinkItems;

  const links =
    rawLinks.enabled !== false && linkItems.length > 0
      ? {
          title:
            typeof rawLinks.title === 'string'
              ? rawLinks.title
              : typeof rawLinks.heading === 'string'
                ? rawLinks.heading
                : undefined,
          description: typeof rawLinks.description === 'string' ? rawLinks.description : undefined,
          items: linkItems,
          cards: linkCards.length > 0 ? linkCards : undefined
        }
      : undefined;

  const calloutActionRaw = rawCallout.action as Record<string, unknown> | undefined;
  const calloutAction =
    calloutActionRaw && typeof calloutActionRaw.label === 'string'
      ? {
          label: calloutActionRaw.label,
          href: sanitizePublicLandingHref(calloutActionRaw.href, '#')
        }
      : undefined;

  const calloutTitle =
    typeof rawCallout.heading === 'string' && rawCallout.heading.length > 0
      ? rawCallout.heading
      : typeof rawCallout.title === 'string'
        ? rawCallout.title
        : '';

  const callout =
    rawCallout.enabled !== false && calloutTitle.length > 0
      ? {
          title: calloutTitle,
          description: typeof rawCallout.description === 'string' ? rawCallout.description : undefined,
          action: calloutAction
        }
      : undefined;

  const embedUrl = resolvePublicLandingEmbedUrl(rawEmbed);
  const embedSecondaryRaw = rawEmbed.secondaryAction as Record<string, unknown> | undefined;

  let embed: PublicLandingPageViewModel['embed'];
  if (rawEmbed.enabled !== false && embedUrl) {
    const rawType = String(rawEmbed.type ?? inferEmbedType(embedUrl));
    const type = ['youtube', 'vimeo', 'loom'].includes(rawType) ? (rawType as 'youtube' | 'vimeo' | 'loom') : 'custom';
    embed = {
      type,
      url: embedUrl,
      aspectRatio: typeof rawEmbed.aspectRatio === 'string' ? rawEmbed.aspectRatio : '16/9',
      title: typeof rawEmbed.title === 'string' && rawEmbed.title.length > 0 ? rawEmbed.title : undefined,
      description:
        typeof rawEmbed.description === 'string' && rawEmbed.description.length > 0 ? rawEmbed.description : undefined,
      secondaryAction:
        embedSecondaryRaw && typeof embedSecondaryRaw.label === 'string' && embedSecondaryRaw.label.length > 0
          ? { label: embedSecondaryRaw.label, href: sanitizePublicLandingHref(embedSecondaryRaw.href, '#') }
          : undefined
    };
  }

  const rawBrand = (rawFooter.brand ?? {}) as Record<string, unknown>;
  const rawBottom = (rawFooter.bottom ?? {}) as Record<string, unknown>;

  const toLinkItems = (raw: unknown): PublicLandingLinkItem[] =>
    (Array.isArray(raw) ? raw : [])
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        label: String(item.label ?? ''),
        href: sanitizePublicLandingHref(item.href, '#')
      }))
      .filter((item) => item.label.length > 0);

  const footerLinks = toLinkItems(
    Array.isArray(rawFooter.links)
      ? rawFooter.links
      : Array.isArray(rawBottom.links)
        ? rawBottom.links
        : rawLanding.footerLinks
  );

  const socialLinksRaw = Array.isArray(rawFooter.socialLinks)
    ? rawFooter.socialLinks
    : Array.isArray(rawBrand.socials)
      ? rawBrand.socials
      : [];
  const socialLinks: PublicLandingSocialLink[] = socialLinksRaw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      platform: String(item.platform ?? ''),
      href: sanitizePublicLandingHref(item.href, '#')
    }))
    .filter((item) => item.platform.length > 0 && item.href !== '#');

  const footerColumns = (Array.isArray(rawFooter.columns) ? rawFooter.columns : [])
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((column) => ({
      heading: String(column.heading ?? ''),
      links: toLinkItems(column.links)
    }))
    .filter((column) => column.heading.length > 0 && column.links.length > 0);

  const optionalText = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : undefined);

  const footer = {
    text: optionalText(rawFooter.text) ?? optionalText(rawBottom.text) ?? optionalText(rawLanding.footerText),
    tagline: optionalText(rawBrand.tagline),
    copyright: optionalText(rawBrand.copyright),
    links: footerLinks,
    socialLinks,
    columns: footerColumns.length > 0 ? footerColumns : undefined
  };

  const avatarUrl = sanitizePublicLandingImage(params.org.avatarUrl, params.baseUrl);

  return {
    theme: params.theme,
    templateId: params.templateId,
    locale: params.org.locale ?? 'en',
    organization: {
      id: params.org.id,
      name: params.org.name,
      siteName: params.org.siteName ?? '',
      avatarUrl
    },
    hero: {
      heading: typeof rawHero.heading === 'string' ? rawHero.heading : params.org.name,
      subheading: typeof rawHero.subheading === 'string' ? rawHero.subheading : undefined,
      eyebrow,
      image: heroImage,
      stats: heroStats.length > 0 ? heroStats : undefined,
      primaryAction,
      secondaryAction
    },
    navigation: {
      navItems,
      signInLabel: params.signInLabel,
      accountLabel: params.accountLabel,
      isAuthenticated: params.isAuthenticated
    },
    courses,
    hasMoreCourses: Boolean(params.hasMoreCourses),
    links,
    callout,
    embed,
    footer
  };
}
