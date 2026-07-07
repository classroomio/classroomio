import type { MetaTagsProps } from 'svelte-meta-tags';
import type { OrgSiteInfo } from '$features/app/layout-setup';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

const DEFAULT_TITLE = 'ClassroomIO | One Platform for Customer, Partner, and Employee Training';
const DEFAULT_DESCRIPTION =
  'One platform for customer academies, partner certification, and employee training. Build courses with AI, publish under your domain, and track completions.';
const CLOUD_OG_IMAGE = 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg';
const ORG_OG_WIDTH = 1200;
const ORG_OG_HEIGHT = 630;

function getApiServerUrl(): string {
  return privateEnv.PRIVATE_SERVER_URL?.trim() || publicEnv.PUBLIC_SERVER_URL?.trim() || '';
}

export function getOrgSiteOgImageUrl(siteName: string): string | null {
  const apiBase = getApiServerUrl();
  if (!apiBase || !siteName) {
    return null;
  }

  return `${apiBase.replace(/\/$/, '')}/org-site/og/${encodeURIComponent(siteName)}.png`;
}

function resolveOgImageUrl(url: URL, orgSiteInfo: OrgSiteInfo): string {
  const envUrl = publicEnv.PUBLIC_OG_IMAGE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  if (orgSiteInfo.isOrgSite && orgSiteInfo.org?.siteName) {
    const dynamicOgUrl = getOrgSiteOgImageUrl(orgSiteInfo.org.siteName);
    if (dynamicOgUrl) {
      return dynamicOgUrl;
    }
  }

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

function buildOrgOpenGraphImages(ogImageUrl: string, siteName: string) {
  return [
    {
      url: ogImageUrl,
      alt: `${siteName} learning platform`,
      width: ORG_OG_WIDTH,
      height: ORG_OG_HEIGHT,
      secureUrl: ogImageUrl,
      type: 'image/png'
    }
  ];
}

export function getBaseMetaTags(url: URL, orgSiteInfo: OrgSiteInfo): MetaTagsProps {
  const title =
    publicEnv.PUBLIC_APP_TITLE?.trim() ||
    (isSelfHosted && orgSiteInfo.org?.name ? `${orgSiteInfo.org.name} | Learning Platform` : DEFAULT_TITLE);

  const description = publicEnv.PUBLIC_APP_DESCRIPTION?.trim() || DEFAULT_DESCRIPTION;

  const siteName =
    publicEnv.PUBLIC_APP_TITLE?.trim() ||
    (isSelfHosted && orgSiteInfo.org?.name ? orgSiteInfo.org.name : null) ||
    'ClassroomIO';

  const ogImageUrl = resolveOgImageUrl(url, orgSiteInfo);
  const usesDynamicOrgOg =
    orgSiteInfo.isOrgSite && Boolean(orgSiteInfo.org?.siteName) && !publicEnv.PUBLIC_OG_IMAGE_URL?.trim();

  const openGraphImages = usesDynamicOrgOg
    ? buildOrgOpenGraphImages(ogImageUrl, siteName)
    : [
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
      ];

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
      images: openGraphImages
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
