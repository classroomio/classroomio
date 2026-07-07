import type { MetaTagsProps } from 'svelte-meta-tags';
import type { OrgSiteInfo } from '$features/app/layout-setup';
import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { env as publicEnv } from '$env/dynamic/public';
import { buildOrgSiteTitle, extractOrgSiteMetaCopy } from '$lib/utils/functions/org-site-meta';

const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

const DEFAULT_TITLE = 'ClassroomIO | One Platform for Customer, Partner, and Employee Training';
const DEFAULT_DESCRIPTION =
  'One platform for customer academies, partner certification, and employee training. Build courses with AI, publish under your domain, and track completions.';
const CLOUD_OG_IMAGE = 'https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg';
const ORG_OG_WIDTH = 1200;
const ORG_OG_HEIGHT = 630;

function isPublicHttpOrigin(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return true;
    }

    return host.includes('.');
  } catch {
    return false;
  }
}

function getOrgSiteOgImageUrl(siteName: string, pageUrl: URL): string | null {
  if (!siteName) {
    return null;
  }

  const ogPath = `/org-site/og/${encodeURIComponent(siteName)}.png`;

  return `${pageUrl.origin}/proxy${ogPath}`;
}

function resolveOgImageUrl(url: URL, orgSiteInfo: OrgSiteInfo): string {
  const envUrl = publicEnv.PUBLIC_OG_IMAGE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  if (orgSiteInfo.isOrgSite && orgSiteInfo.org?.siteName) {
    const dynamicOgUrl = getOrgSiteOgImageUrl(orgSiteInfo.org.siteName, url);
    if (dynamicOgUrl) {
      return dynamicOgUrl;
    }
  }

  const publicServerUrl = publicEnv.PUBLIC_SERVER_URL?.trim();
  if (publicServerUrl && isPublicHttpOrigin(publicServerUrl) && orgSiteInfo.org?.siteName) {
    return `${publicServerUrl.replace(/\/$/, '')}/org-site/og/${encodeURIComponent(orgSiteInfo.org.siteName)}.png`;
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

function buildOrgOpenGraphImages(ogImageUrl: string, orgName: string) {
  return [
    {
      url: ogImageUrl,
      alt: `${orgName} learning platform`,
      width: ORG_OG_WIDTH,
      height: ORG_OG_HEIGHT,
      secureUrl: ogImageUrl.startsWith('https://') ? ogImageUrl : undefined,
      type: 'image/png'
    }
  ];
}

function resolveOrgSiteMeta(orgSiteInfo: OrgSiteInfo): {
  title: string;
  description: string;
  siteName: string;
} | null {
  const org = orgSiteInfo.org;
  if (!orgSiteInfo.isOrgSite || !org?.name?.trim()) {
    return null;
  }

  const orgName = org.name.trim();
  const metaCopy = extractOrgSiteMetaCopy(org.landingpage);

  return {
    title: publicEnv.PUBLIC_APP_TITLE?.trim() || buildOrgSiteTitle(orgName, metaCopy.heading),
    description:
      publicEnv.PUBLIC_APP_DESCRIPTION?.trim() ||
      metaCopy.description ||
      `Explore courses and training programs from ${orgName}.`,
    siteName: orgName
  };
}

export function getBaseMetaTags(url: URL, orgSiteInfo: OrgSiteInfo): MetaTagsProps {
  const orgMeta = resolveOrgSiteMeta(orgSiteInfo);

  const title =
    orgMeta?.title ||
    publicEnv.PUBLIC_APP_TITLE?.trim() ||
    (isSelfHosted && orgSiteInfo.org?.name ? `${orgSiteInfo.org.name} | Learning Platform` : DEFAULT_TITLE);

  const description = orgMeta?.description || publicEnv.PUBLIC_APP_DESCRIPTION?.trim() || DEFAULT_DESCRIPTION;

  const siteName =
    orgMeta?.siteName ||
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
          secureUrl: ogImageUrl.startsWith('https://') ? ogImageUrl : undefined,
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

  const imageAlt = usesDynamicOrgOg
    ? `${siteName} learning platform`
    : `${siteName} platform for customer, partner, and employee education`;

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
      imageAlt
    }
  });
}
