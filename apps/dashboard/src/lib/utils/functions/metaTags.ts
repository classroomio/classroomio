import type { MetaTagsProps } from 'svelte-meta-tags';
import type { OrgSiteInfo } from '$features/app/layout-setup';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { env } from '$env/dynamic/public';

const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

const DEFAULT_TITLE = 'ClassroomIO | One Platform for Customer, Partner, and Employee Training';
const DEFAULT_DESCRIPTION =
  'One platform for customer academies, partner certification, and employee training. Build courses with AI, publish under your domain, and track completions.';
const CLOUD_OG_IMAGE = 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg';

function resolveOgImageUrl(url: URL, orgSiteInfo: OrgSiteInfo): string {
  const envUrl = env.PUBLIC_OG_IMAGE_URL?.trim();
  if (envUrl) return envUrl;

  if (isSelfHosted) {
    const org = orgSiteInfo.org;
    if (!org) {
      return CLOUD_OG_IMAGE;
    }

    const orgImage =
      org.avatarUrl ||
      org.landingpage?.header?.banner?.image ||
      (org as { customization?: { dashboard?: { bannerImage?: string } } }).customization?.dashboard?.bannerImage;
    if (orgImage) {
      try {
        return new URL(orgImage, url.origin).href;
      } catch {
        // fall through to bundled default
      }
    }
  }

  return CLOUD_OG_IMAGE;
}

export function getBaseMetaTags(url: URL, orgSiteInfo: OrgSiteInfo): MetaTagsProps {
  const title =
    env.PUBLIC_APP_TITLE?.trim() ||
    (isSelfHosted && orgSiteInfo.org?.name ? `${orgSiteInfo.org.name} | Learning Platform` : DEFAULT_TITLE);

  const description = env.PUBLIC_APP_DESCRIPTION?.trim() || DEFAULT_DESCRIPTION;

  const siteName =
    env.PUBLIC_APP_TITLE?.trim() ||
    (isSelfHosted && orgSiteInfo.org?.name ? orgSiteInfo.org.name : null) ||
    'ClassroomIO';

  const ogImageUrl = resolveOgImageUrl(url, orgSiteInfo);

  return Object.freeze({
    title,
    description,
    canonical: new URL(url.pathname, url.origin).href,
    openGraph: {
      type: 'website',
      url: new URL(url.pathname, url.origin).href,
      locale: 'en_US',
      title,
      description,
      siteName,
      images: [
        {
          url: ogImageUrl,
          alt: `${siteName} platform for customer, partner, and employee education`,
          width: 1920,
          height: 1080,
          secureUrl: ogImageUrl,
          type: 'image/jpeg'
        },
        {
          url: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.webp',
          alt: `${siteName} platform for customer, partner, and employee education`,
          width: 1920,
          height: 1080,
          secureUrl: 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.webp',
          type: 'image/webp'
        }
      ]
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image' as const,
      title,
      description,
      image: ogImageUrl,
      imageAlt: `${siteName} platform for customer, partner, and employee education`
    }
  });
}
