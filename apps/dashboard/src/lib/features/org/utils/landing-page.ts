import type { AccountOrg } from '$features/app/types';
import type {
  OrgLandingPageCallout,
  OrgLandingPageFooterLink,
  OrgLandingPageHero,
  OrgLandingPageJson,
  OrgLandingPageNavItem,
  OrgLandingPageTheme
} from '$lib/utils/types/org';
import type { OrgPublicCourses } from './types';
import type { OrgLandingPageProps } from '@cio/ui/custom/org-landing-page/types';

export const landingPageThemes = ['minimal', 'bold', 'classic'] as const satisfies OrgLandingPageTheme[];

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

export const defaultLandingPageSettings: OrgLandingPageJson = {
  theme: 'minimal',
  hero: defaultLandingPageHero,
  navItems: [
    { label: 'Programs', href: '#courses' },
    { label: 'Contact', href: '#contact' }
  ],
  footerLinks: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Contact', href: '#contact' }
  ],
  footerText: ''
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
  footerLinks?: OrgLandingPageFooterLink[];
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
  if (!heading) return undefined;

  return {
    heading,
    description: normalizeText(callout.description, ''),
    action: {
      label: normalizeText(callout.action?.label, 'Get Started'),
      href: normalizeHref(callout.action?.href, '#')
    }
  };
}

export function normalizeLandingPageSettings(value: unknown): OrgLandingPageJson {
  const defaultSettings = createDefaultLandingPageSettings();

  if (!isRecord(value)) {
    return defaultSettings;
  }

  const landingPage = value as LegacyLandingPageJson;
  if (landingPage.hero && landingPage.navItems && landingPage.footerLinks && landingPage.theme) {
    return {
      theme: landingPage.theme,
      hero: {
        heading: normalizeText(landingPage.hero.heading, defaultLandingPageHero.heading),
        subheading: normalizeText(landingPage.hero.subheading, defaultLandingPageHero.subheading),
        primaryAction: {
          label: normalizeText(landingPage.hero.primaryAction?.label, defaultLandingPageHero.primaryAction.label),
          href: normalizeHref(landingPage.hero.primaryAction?.href, defaultLandingPageHero.primaryAction.href)
        },
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
          : undefined,
        image: normalizeText(landingPage.hero.image, '')
      },
      navItems: landingPage.navItems
        .map((navItem) => ({
          label: normalizeText(navItem.label, ''),
          href: normalizeHref(navItem.href, '#')
        }))
        .filter((navItem) => navItem.label.length > 0),
      footerLinks: landingPage.footerLinks
        .map((footerLink) => ({
          label: normalizeText(footerLink.label, ''),
          href: normalizeHref(footerLink.href, '#')
        }))
        .filter((footerLink) => footerLink.label.length > 0),
      footerText: normalizeText(landingPage.footerText, defaultSettings.footerText),
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
      callout: landingPage.callout ? normalizeCallout(landingPage.callout) : undefined
    };
  }

  if (landingPage.hero) {
    return {
      theme: landingPage.theme ?? 'minimal',
      hero: {
        heading: normalizeText(landingPage.hero.heading, defaultLandingPageHero.heading),
        subheading: normalizeText(landingPage.hero.subheading, defaultLandingPageHero.subheading),
        primaryAction: {
          label: normalizeText(landingPage.hero.primaryAction?.label, defaultLandingPageHero.primaryAction.label),
          href: normalizeHref(landingPage.hero.primaryAction?.href, defaultLandingPageHero.primaryAction.href)
        },
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
      footerLinks: landingPage.footerLinks?.length
        ? landingPage.footerLinks
            .map((footerLink) => ({
              label: normalizeText(footerLink.label, ''),
              href: normalizeHref(footerLink.href, '#')
            }))
            .filter((footerLink) => footerLink.label.length > 0)
        : [...defaultSettings.footerLinks],
      footerText: normalizeText(landingPage.footerText, defaultSettings.footerText),
      embed: landingPage.embed
        ? {
            title: normalizeText(landingPage.embed.title, 'Section title'),
            description: normalizeText(landingPage.embed.description, ''),
            code: normalizeEmbedCode(landingPage.embed)
          }
        : undefined,
      callout: landingPage.callout ? normalizeCallout(landingPage.callout) : undefined
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
    footerLinks: [
      landingPage.footer?.facebook ? { label: 'Facebook', href: landingPage.footer.facebook } : null,
      landingPage.footer?.instagram ? { label: 'Instagram', href: landingPage.footer.instagram } : null,
      landingPage.footer?.twitter ? { label: 'Twitter', href: landingPage.footer.twitter } : null,
      landingPage.footer?.linkedin ? { label: 'LinkedIn', href: landingPage.footer.linkedin } : null
    ].filter(Boolean) as OrgLandingPageFooterLink[],
    footerText: defaultSettings.footerText,
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
      : undefined
  };
}

export function mapPublicCoursesToLandingPageCourses(courses: OrgPublicCourses): OrgLandingPageProps['courses'] {
  return courses.map((course) => {
    const courseRecord = course as Record<string, unknown>;
    const metadataRecord = isRecord(courseRecord.metadata) ? courseRecord.metadata : undefined;
    const tags = Array.isArray(courseRecord.tags)
      ? (courseRecord.tags as OrgLandingPageProps['courses'][number]['tags'])
      : undefined;
    const courseSlug =
      typeof courseRecord.slug === 'string' && courseRecord.slug.length > 0 ? courseRecord.slug : course.id;
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
      link: `/course/${courseSlug}`,
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
    default:
      return import('@cio/ui/custom/org-landing-page/minimal.svelte');
  }
}
