import type { AccountOrg } from '$features/app/types';
import type {
  FooterColumn,
  FooterColumnLink,
  FooterSocial,
  OrgLandingPageCallout,
  OrgLandingPageFooterConfig,
  OrgLandingPageHero,
  OrgLandingPageJson,
  OrgLandingPageLinks,
  OrgLandingPageNavItem,
  OrgLandingPageTheme
} from '$lib/utils/types/org';
import type { OrgPublicCourses } from './types';
import type { OrgLandingPageProps } from '@cio/ui/custom/org-landing-page/types';
import { resolveLandingPageLinkIcon } from '@cio/ui/custom/org-landing-page/landing-page-link-icons';
import {
  labelMatchesSocialPlatform,
  resolveFooterSocialPlatform
} from '@cio/ui/custom/org-landing-page/footer-social-platform';

export const landingPageThemes = [
  'minimal',
  'bold',
  'classic',
  'saas',
  'tech',
  'studio',
  'corporate',
  'terminal',
  'editorial',
  'vibrant'
] as const satisfies OrgLandingPageTheme[];

export const defaultLandingPageHero: OrgLandingPageHero = {
  heading: 'Become a Certified AI Engineer',
  subheading: 'Master the skills, earn your certification, and prove your expertise with hands-on training programs.',
  primaryAction: {
    label: 'Get Started',
    href: '#courses'
  },
  secondaryAction: {
    label: 'View Programs',
    href: '/courses'
  },
  image: '/images/learn-on-cio.jpg'
};

function newFooterColumnId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `footer-col_${Math.random().toString(36).slice(2, 11)}`;
}

export function newFooterLinkId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `footer-link_${Math.random().toString(36).slice(2, 11)}`;
}

export function createDefaultFooterConfig(): OrgLandingPageFooterConfig {
  return {
    brand: {
      socials: []
    },
    columns: [],
    bottom: {
      text: '',
      links: [
        { id: newFooterLinkId(), label: 'Terms', href: '/terms' },
        { id: newFooterLinkId(), label: 'Privacy', href: '/privacy' },
        { id: newFooterLinkId(), label: 'Contact', href: '#contact' }
      ]
    }
  };
}

export const defaultLandingPageSettings: OrgLandingPageJson = {
  theme: 'minimal',
  hero: defaultLandingPageHero,
  navItems: [
    { label: 'Programs', href: '#courses' },
    { label: 'Contact', href: '#contact' }
  ],
  footer: createDefaultFooterConfig()
};

export function createDefaultLandingPageSettings(): OrgLandingPageJson {
  return structuredClone(defaultLandingPageSettings);
}

type LegacyLandingPageJson = {
  header?: {
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    action?: {
      label?: string;
      link?: string;
    };
  };
  customLinks?: {
    links?: Array<{
      label?: string;
      url?: string;
      openInNewTab?: boolean;
    }>;
  };
  footer?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  hero?: OrgLandingPageHero;
  navItems?: OrgLandingPageNavItem[];
  /** @deprecated migrated to `footer` */
  footerLinks?: Array<{ label?: string; href?: string }>;
  /** @deprecated migrated to `footer.bottom.text` */
  footerText?: string;
  theme?: OrgLandingPageTheme;
  embed?: {
    title?: string;
    description?: string;
    code?: string;
    secondaryAction?: {
      label?: string;
      href?: string;
    };
    src?: string;
    height?: number;
    allowFullscreen?: boolean;
    sandbox?: string;
  };
  callout?: {
    heading?: string;
    description?: string;
    action?: {
      label?: string;
      href?: string;
    };
  };
  links?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeHref(value: unknown, fallback = '#') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function isLegacyFooterSocialBlock(value: Record<string, unknown>): boolean {
  return (
    typeof value.facebook === 'string' ||
    typeof value.instagram === 'string' ||
    typeof value.twitter === 'string' ||
    typeof value.linkedin === 'string'
  );
}

function isModernFooterConfig(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (!('brand' in value) || !('columns' in value)) {
    return false;
  }

  const brand = value.brand;
  if (!isRecord(brand)) {
    return false;
  }

  return Array.isArray(brand.socials) && Array.isArray(value.columns);
}

function normalizeFooterShape(raw: Record<string, unknown>): OrgLandingPageFooterConfig {
  const defaultFooter = createDefaultFooterConfig();
  const brandRaw = isRecord(raw.brand) ? raw.brand : {};
  const socialsRaw = Array.isArray(brandRaw.socials) ? brandRaw.socials : [];

  const socials: FooterSocial[] = socialsRaw
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const href = normalizeHref(entry.href, '');
      if (!href || href === '#') {
        return null;
      }

      return {
        platform: resolveFooterSocialPlatform(entry.platform),
        href
      };
    })
    .filter((item): item is FooterSocial => item !== null);

  const tagline = normalizeText(brandRaw.tagline, '');
  const copyright = normalizeText(brandRaw.copyright, '');

  const columnsRaw = Array.isArray(raw.columns) ? raw.columns : [];
  const columns: FooterColumn[] = columnsRaw.slice(0, 6).flatMap((columnRaw) => {
    if (!isRecord(columnRaw)) {
      return [];
    }

    const id =
      typeof columnRaw.id === 'string' && columnRaw.id.trim().length > 0 ? columnRaw.id.trim() : newFooterColumnId();
    const heading = normalizeText(columnRaw.heading, '');
    const linksRaw = Array.isArray(columnRaw.links) ? columnRaw.links : [];
    const links: FooterColumnLink[] = linksRaw.slice(0, 10).flatMap((linkRaw) => {
      if (!isRecord(linkRaw)) {
        return [];
      }

      const label = normalizeText(linkRaw.label, '');
      const href = normalizeHref(linkRaw.href, '#');
      if (!label) {
        return [];
      }

      const linkId =
        typeof linkRaw.id === 'string' && linkRaw.id.trim().length > 0 ? linkRaw.id.trim() : newFooterLinkId();
      return [{ id: linkId, label, href }];
    });

    let cta: FooterColumn['cta'];
    const ctaRaw = columnRaw.cta;
    if (isRecord(ctaRaw)) {
      const ctaLabel = normalizeText(ctaRaw.label, '');
      const ctaHref = normalizeHref(ctaRaw.href, '');
      if (ctaLabel && ctaHref && ctaHref !== '#') {
        cta = { label: ctaLabel, href: ctaHref };
      }
    }

    if (links.length === 0 && !heading && !cta) {
      return [];
    }

    return [{ id, heading, links, cta }];
  });

  let bottom: OrgLandingPageFooterConfig['bottom'];
  const bottomRaw = raw.bottom;
  if (isRecord(bottomRaw)) {
    const text = normalizeText(bottomRaw.text, '');
    const linksRaw = Array.isArray(bottomRaw.links) ? bottomRaw.links : [];
    const bottomLinks: FooterColumnLink[] = linksRaw.flatMap((linkRaw) => {
      if (!isRecord(linkRaw)) {
        return [];
      }

      const label = normalizeText(linkRaw.label, '');
      const href = normalizeHref(linkRaw.href, '#');
      if (!label) {
        return [];
      }

      const linkId =
        typeof linkRaw.id === 'string' && linkRaw.id.trim().length > 0 ? linkRaw.id.trim() : newFooterLinkId();
      return [{ id: linkId, label, href }];
    });

    if (text || bottomLinks.length > 0) {
      bottom = {
        text: text || undefined,
        links: bottomLinks
      };
    }
  }

  return {
    brand: {
      socials,
      tagline: tagline || undefined,
      copyright: copyright || undefined
    },
    columns,
    bottom: bottom ?? defaultFooter.bottom
  };
}

function legacySocialsFromFooterBlock(footer: LegacyLandingPageJson['footer']): FooterSocial[] {
  if (!footer || !isRecord(footer as Record<string, unknown>)) {
    return [];
  }

  const block = footer as Record<string, unknown>;
  if (!isLegacyFooterSocialBlock(block)) {
    return [];
  }

  const out: FooterSocial[] = [];
  const fb = normalizeHref(block.facebook, '');
  const ig = normalizeHref(block.instagram, '');
  const tw = normalizeHref(block.twitter, '');
  const li = normalizeHref(block.linkedin, '');

  if (fb && fb !== '#') {
    out.push({ platform: 'facebook', href: fb });
  }

  if (ig && ig !== '#') {
    out.push({ platform: 'instagram', href: ig });
  }

  if (tw && tw !== '#') {
    out.push({ platform: 'x', href: tw });
  }

  if (li && li !== '#') {
    out.push({ platform: 'linkedin', href: li });
  }

  return out;
}

function migrateFooterFromLegacy(landingPage: LegacyLandingPageJson): OrgLandingPageFooterConfig {
  const defaults = createDefaultFooterConfig();
  const socials: FooterSocial[] = [...legacySocialsFromFooterBlock(landingPage.footer)];
  const bottomLinks: FooterColumnLink[] = [];

  if (Array.isArray(landingPage.footerLinks) && landingPage.footerLinks.length > 0) {
    for (const link of landingPage.footerLinks) {
      const label = normalizeText(link?.label, '');
      const href = normalizeHref(link?.href, '#');
      if (!label) {
        continue;
      }

      const platform = labelMatchesSocialPlatform(label);
      if (platform) {
        socials.push({ platform, href });
      } else {
        bottomLinks.push({ id: newFooterLinkId(), label, href });
      }
    }
  }

  const bottomText = normalizeText(landingPage.footerText, '');
  const resolvedBottomLinks = bottomLinks.length > 0 ? bottomLinks : (defaults.bottom?.links ?? []);

  return {
    brand: {
      socials
    },
    columns: [],
    bottom: {
      text: bottomText || undefined,
      links: resolvedBottomLinks
    }
  };
}

function resolveFooterConfig(landingPage: LegacyLandingPageJson & Record<string, unknown>): OrgLandingPageFooterConfig {
  const footerRaw = landingPage.footer;

  if (footerRaw && isModernFooterConfig(footerRaw)) {
    return normalizeFooterShape(footerRaw as Record<string, unknown>);
  }

  return migrateFooterFromLegacy(landingPage);
}

function normalizeEmbedCode(embed: {
  title?: unknown;
  description?: unknown;
  code?: unknown;
  src?: unknown;
  height?: unknown;
  allowFullscreen?: unknown;
  sandbox?: unknown;
}) {
  if (typeof embed.code === 'string' && embed.code.trim().length > 0) {
    return embed.code.trim();
  }

  const src = normalizeHref(embed.src, '');
  if (!src) {
    return '';
  }

  const height = typeof embed.height === 'number' && Number.isFinite(embed.height) ? embed.height : 560;
  const allowFullscreen = embed.allowFullscreen !== false;
  const title = normalizeText(embed.title, 'Section title');
  const sandbox =
    typeof embed.sandbox === 'string' && embed.sandbox.trim().length > 0 ? ` sandbox="${embed.sandbox.trim()}"` : '';

  return `<iframe title="${title}" src="${src}" width="100%" height="${height}" loading="lazy" referrerpolicy="no-referrer"${sandbox}${
    allowFullscreen ? ' allowfullscreen' : ''
  }></iframe>`;
}

function normalizeCallout(callout: NonNullable<LegacyLandingPageJson['callout']>): OrgLandingPageCallout | undefined {
  const heading = normalizeText(callout.heading, '');
  if (!heading) {
    return undefined;
  }

  return {
    heading,
    description: normalizeText(callout.description, ''),
    action: {
      label: normalizeText(callout.action?.label, 'Get Started'),
      href: normalizeHref(callout.action?.href, '#')
    }
  };
}

function normalizeLinks(raw: unknown): OrgLandingPageLinks | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const heading = normalizeText(raw.heading, '');
  if (!heading) {
    return undefined;
  }

  const cardsRaw = raw.cards;
  if (!Array.isArray(cardsRaw)) {
    return undefined;
  }

  const cards: OrgLandingPageLinks['cards'] = cardsRaw
    .slice(0, 3)
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const title = normalizeText(item.title, '');
      const hrefSource = typeof item.href === 'string' ? item.href.trim() : '';
      if (!title || !hrefSource) {
        return null;
      }

      return {
        icon: resolveLandingPageLinkIcon(item.icon),
        title,
        description: normalizeText(item.description, ''),
        href: hrefSource
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  if (cards.length === 0) {
    return undefined;
  }

  const description = normalizeText(raw.description, '');
  const boldVisitLabel = normalizeText(raw.boldVisitLabel, '');
  const classicLearnMoreLabel = normalizeText(raw.classicLearnMoreLabel, '');

  return {
    heading,
    description: description || undefined,
    boldVisitLabel: boldVisitLabel || undefined,
    classicLearnMoreLabel: classicLearnMoreLabel || undefined,
    cards
  };
}

const MAX_HERO_STATS = 4;

function normalizeHeroStats(raw: unknown): OrgLandingPageHero['stats'] {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const stats = raw.slice(0, MAX_HERO_STATS).flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const label = normalizeText(entry.label, '');
    const value = normalizeText(entry.value, '');
    if (!label || !value) {
      return [];
    }

    return [{ label, value }];
  });

  return stats.length > 0 ? stats : undefined;
}

function normalizeHero(hero: NonNullable<LegacyLandingPageJson['hero']>): OrgLandingPageHero {
  return {
    heading: normalizeText(hero.heading, defaultLandingPageHero.heading),
    subheading: normalizeText(hero.subheading, defaultLandingPageHero.subheading),
    primaryAction: {
      label: normalizeText(hero.primaryAction?.label, defaultLandingPageHero.primaryAction.label),
      href: normalizeHref(hero.primaryAction?.href, defaultLandingPageHero.primaryAction.href)
    },
    secondaryAction: hero.secondaryAction
      ? {
          label: normalizeText(hero.secondaryAction.label, defaultLandingPageHero.secondaryAction?.label ?? ''),
          href: normalizeHref(hero.secondaryAction.href, defaultLandingPageHero.secondaryAction?.href ?? '#')
        }
      : undefined,
    image: normalizeText(hero.image, ''),
    stats: normalizeHeroStats((hero as { stats?: unknown }).stats)
  };
}

export function normalizeLandingPageSettings(value: unknown): OrgLandingPageJson {
  const defaultSettings = createDefaultLandingPageSettings();

  if (!isRecord(value)) {
    return defaultSettings;
  }

  const landingPage = value as LegacyLandingPageJson & Record<string, unknown>;

  if (landingPage.hero && landingPage.navItems && landingPage.theme) {
    return {
      theme: landingPage.theme,
      hero: normalizeHero(landingPage.hero),
      navItems: landingPage.navItems
        .map((navItem) => ({
          label: normalizeText(navItem.label, ''),
          href: normalizeHref(navItem.href, '#')
        }))
        .filter((navItem) => navItem.label.length > 0),
      footer: resolveFooterConfig(landingPage),
      embed: landingPage.embed
        ? {
            title: normalizeText(landingPage.embed.title, 'Section title'),
            description: normalizeText(landingPage.embed.description, ''),
            code: normalizeEmbedCode(landingPage.embed),
            secondaryAction: landingPage.embed.secondaryAction
              ? {
                  label: normalizeText(landingPage.embed.secondaryAction.label, ''),
                  href: normalizeHref(landingPage.embed.secondaryAction.href, '#')
                }
              : undefined
          }
        : undefined,
      callout: landingPage.callout ? normalizeCallout(landingPage.callout) : undefined,
      links: normalizeLinks(landingPage.links)
    };
  }

  if (landingPage.hero) {
    return {
      theme: landingPage.theme ?? 'minimal',
      hero: {
        ...normalizeHero(landingPage.hero),
        secondaryAction: landingPage.hero.secondaryAction
          ? {
              label: normalizeText(
                landingPage.hero.secondaryAction.label,
                defaultLandingPageHero.secondaryAction?.label ?? ''
              ),
              href: normalizeHref(
                landingPage.hero.secondaryAction.href,
                defaultLandingPageHero.secondaryAction?.href ?? '#'
              )
            }
          : defaultLandingPageHero.secondaryAction,
        image: normalizeText(landingPage.hero.image, defaultLandingPageHero.image ?? '')
      },
      navItems: landingPage.navItems?.length
        ? landingPage.navItems
            .map((navItem) => ({
              label: normalizeText(navItem.label, ''),
              href: normalizeHref(navItem.href, '#')
            }))
            .filter((navItem) => navItem.label.length > 0)
        : [...defaultSettings.navItems],
      footer: resolveFooterConfig(landingPage),
      embed: landingPage.embed
        ? {
            title: normalizeText(landingPage.embed.title, 'Section title'),
            description: normalizeText(landingPage.embed.description, ''),
            code: normalizeEmbedCode(landingPage.embed)
          }
        : undefined,
      callout: landingPage.callout ? normalizeCallout(landingPage.callout) : undefined,
      links: normalizeLinks(landingPage.links)
    };
  }

  const fallbackHeading = normalizeText(landingPage.header?.title, defaultLandingPageHero.heading);
  const fallbackHighlight = normalizeText(landingPage.header?.titleHighlight, '');
  const fallbackSubheading = normalizeText(landingPage.header?.subtitle, defaultLandingPageHero.subheading);

  return {
    ...defaultSettings,
    hero: {
      heading: fallbackHighlight ? `${fallbackHeading} ${fallbackHighlight}` : fallbackHeading,
      subheading: fallbackSubheading,
      primaryAction: {
        label: normalizeText(landingPage.header?.action?.label, defaultLandingPageHero.primaryAction.label),
        href: normalizeHref(landingPage.header?.action?.link, defaultLandingPageHero.primaryAction.href)
      },
      secondaryAction: defaultLandingPageHero.secondaryAction,
      image: defaultLandingPageHero.image
    },
    navItems: landingPage.customLinks?.links?.length
      ? landingPage.customLinks.links
          .map((link) => ({
            label: normalizeText(link.label, ''),
            href: normalizeHref(link.url, '#')
          }))
          .filter((navItem) => navItem.label.length > 0)
      : [...defaultSettings.navItems],
    footer: resolveFooterConfig(landingPage),
    embed: landingPage.embed
      ? {
          title: normalizeText(landingPage.embed.title, 'Section title'),
          description: normalizeText(landingPage.embed.description, ''),
          code: normalizeEmbedCode(landingPage.embed),
          secondaryAction: landingPage.embed.secondaryAction
            ? {
                label: normalizeText(landingPage.embed.secondaryAction.label, ''),
                href: normalizeHref(landingPage.embed.secondaryAction.href, '#')
              }
            : undefined
        }
      : undefined,
    links: normalizeLinks(landingPage.links)
  };
}

export function mapPublicCoursesToLandingPageCourses(courses: OrgPublicCourses): OrgLandingPageProps['courses'] {
  return courses.map((course) => {
    const courseRecord = course as Record<string, unknown>;
    const metadataRecord = isRecord(courseRecord.metadata) ? courseRecord.metadata : undefined;
    const tags = Array.isArray(courseRecord.tags)
      ? (courseRecord.tags as OrgLandingPageProps['courses'][number]['tags'])
      : undefined;
    const courseSlug = typeof courseRecord.slug === 'string' && courseRecord.slug.length > 0 ? courseRecord.slug : '';
    const courseCost = typeof courseRecord.cost === 'number' ? courseRecord.cost : undefined;
    const courseCurrency = typeof courseRecord.currency === 'string' ? courseRecord.currency : undefined;
    const lessonCount = typeof courseRecord.lessonCount === 'number' ? courseRecord.lessonCount : undefined;
    const exerciseCount = typeof courseRecord.exerciseCount === 'number' ? courseRecord.exerciseCount : undefined;
    const totalStudents = typeof courseRecord.totalStudents === 'number' ? courseRecord.totalStudents : undefined;
    const image = typeof courseRecord.image === 'string' ? courseRecord.image : undefined;
    const logo = typeof courseRecord.logo === 'string' ? courseRecord.logo : undefined;
    const price = typeof courseRecord.price === 'string' ? courseRecord.price : undefined;
    const duration = typeof courseRecord.duration === 'string' ? courseRecord.duration : undefined;
    const level = typeof courseRecord.level === 'string' ? courseRecord.level : undefined;
    const description = typeof courseRecord.description === 'string' ? courseRecord.description : '';
    const type = typeof courseRecord.type === 'string' ? courseRecord.type : undefined;
    const isPublished = typeof courseRecord.isPublished === 'boolean' ? courseRecord.isPublished : true;

    return {
      id: course.id,
      slug: typeof courseRecord.slug === 'string' ? courseRecord.slug : undefined,
      logo: logo ?? null,
      title: typeof courseRecord.title === 'string' ? courseRecord.title : '',
      description,
      type,
      isPublished,
      cost: courseCost,
      currency: courseCurrency,
      lessonCount,
      exerciseCount,
      totalStudents,
      metadata: metadataRecord
        ? {
            discount: typeof metadataRecord.discount === 'number' ? metadataRecord.discount : undefined,
            showDiscount: typeof metadataRecord.showDiscount === 'boolean' ? metadataRecord.showDiscount : undefined
          }
        : undefined,
      tags,
      image,
      link: courseSlug ? `/course/${courseSlug}` : undefined,
      price,
      duration,
      level
    };
  });
}

export function buildOrgLandingPageProps(
  org: AccountOrg,
  landingpage: unknown,
  courses: OrgPublicCourses,
  hasMoreCourses = false,
  authAction?: OrgLandingPageProps['authAction']
): OrgLandingPageProps {
  const normalizedLandingPage = normalizeLandingPageSettings(landingpage);

  return {
    orgName: org.name,
    logoUrl: org.avatarUrl || undefined,
    authAction,
    ...normalizedLandingPage,
    courses: mapPublicCoursesToLandingPageCourses(courses),
    hasMoreCourses
  };
}

export type LandingPageThemeKey = (typeof landingPageThemes)[number];

export function importThemeComponent(theme: LandingPageThemeKey) {
  switch (theme) {
    case 'bold':
      return import('@cio/ui/custom/org-landing-page/bold.svelte');
    case 'classic':
      return import('@cio/ui/custom/org-landing-page/classic.svelte');
    case 'saas':
      return import('@cio/ui/custom/org-landing-page/saas.svelte');
    case 'tech':
      return import('@cio/ui/custom/org-landing-page/tech.svelte');
    case 'studio':
      return import('@cio/ui/custom/org-landing-page/studio.svelte');
    case 'corporate':
      return import('@cio/ui/custom/org-landing-page/corporate.svelte');
    case 'terminal':
      return import('@cio/ui/custom/org-landing-page/terminal.svelte');
    case 'editorial':
      return import('@cio/ui/custom/org-landing-page/editorial.svelte');
    case 'vibrant':
      return import('@cio/ui/custom/org-landing-page/vibrant.svelte');
    default:
      return import('@cio/ui/custom/org-landing-page/minimal.svelte');
  }
}

const NAV_SNIPPET_THEMES: ReadonlySet<LandingPageThemeKey> = new Set([
  'minimal',
  'saas',
  'tech',
  'studio',
  'corporate',
  'terminal',
  'editorial',
  'vibrant'
]);

export function themeRendersNavInsideHero(theme: LandingPageThemeKey): boolean {
  return NAV_SNIPPET_THEMES.has(theme);
}

export function themeHeaderShellClass(_theme: LandingPageThemeKey): string {
  return 'ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:font-sans';
}

export { themeStyle } from '@cio/ui/custom/org-landing-page/theme-style';

export async function importThemeCourseCard(theme: LandingPageThemeKey) {
  switch (theme) {
    case 'bold':
      return (await import('@cio/ui/custom/org-landing-page/bold/course-card.svelte')).default;
    case 'classic':
      return (await import('@cio/ui/custom/org-landing-page/classic/course-card.svelte')).default;
    case 'saas':
      return (await import('@cio/ui/custom/org-landing-page/saas/course-card.svelte')).default;
    case 'tech':
      return (await import('@cio/ui/custom/org-landing-page/tech/course-card.svelte')).default;
    case 'studio':
      return (await import('@cio/ui/custom/org-landing-page/studio/course-card.svelte')).default;
    case 'corporate':
      return (await import('@cio/ui/custom/org-landing-page/corporate/course-card.svelte')).default;
    case 'terminal':
      return (await import('@cio/ui/custom/org-landing-page/terminal/course-card.svelte')).default;
    case 'editorial':
      return (await import('@cio/ui/custom/org-landing-page/editorial/course-card.svelte')).default;
    case 'vibrant':
      return (await import('@cio/ui/custom/org-landing-page/vibrant/course-card.svelte')).default;
    default:
      return (await import('@cio/ui/custom/org-landing-page/minimal/course-card.svelte')).default;
  }
}

export function themeCourseGridClass(theme: LandingPageThemeKey): string {
  switch (theme) {
    case 'corporate':
    case 'tech':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:border-t ui:border-l ui:border-[var(--landing-border)]';
    case 'saas':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-px ui:bg-[var(--landing-border)] ui:border ui:border-[var(--landing-border)]';
    case 'minimal':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-6';
    case 'studio':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-3';
    case 'terminal':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-[14px]';
    case 'editorial':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-4';
    case 'vibrant':
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-5';
    default:
      return 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-6';
  }
}

export async function importThemeNavHero(theme: LandingPageThemeKey) {
  switch (theme) {
    case 'bold': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/bold/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/bold/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'classic': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/classic/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/classic/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'saas': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/saas/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/saas/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'tech': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/tech/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/tech/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'studio': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/studio/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/studio/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'corporate': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/corporate/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/corporate/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'terminal': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/terminal/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/terminal/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'editorial': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/editorial/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/editorial/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    case 'vibrant': {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/vibrant/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/vibrant/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
    default: {
      const [nav, hero] = await Promise.all([
        import('@cio/ui/custom/org-landing-page/minimal/nav.svelte'),
        import('@cio/ui/custom/org-landing-page/minimal/hero.svelte')
      ]);
      return { NavComponent: nav.default, HeroComponent: hero.default };
    }
  }
}
