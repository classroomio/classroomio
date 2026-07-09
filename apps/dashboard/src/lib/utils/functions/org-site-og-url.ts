import { buildOrgSiteOgApiUrl, buildOrgSiteOgCdnUrl } from '@cio/utils/org-site/og-public-url';

const DEFAULT_CLOUD_MEDIA_CDN_URL = 'https://img.cdn.clsrio.com';

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

const CDN_HEAD_TIMEOUT_MS = 2000;

async function isOrgSiteOgCdnObjectAvailable(cdnUrl: string): Promise<boolean> {
  try {
    const response = await fetch(cdnUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(CDN_HEAD_TIMEOUT_MS)
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function resolveOrgSiteOgImageUrl(options: {
  siteName: string;
  pageOrigin: string;
  isSelfHosted: boolean;
  mediaCdnUrl?: string | null;
  publicServerUrl?: string | null;
}): Promise<string | null> {
  const siteName = options.siteName.trim();
  if (!siteName) {
    return null;
  }

  const mediaCdnUrl = options.mediaCdnUrl?.trim() || (!options.isSelfHosted ? DEFAULT_CLOUD_MEDIA_CDN_URL : '');
  if (mediaCdnUrl && isPublicHttpOrigin(mediaCdnUrl)) {
    const cdnUrl = buildOrgSiteOgCdnUrl(siteName, mediaCdnUrl);
    if (await isOrgSiteOgCdnObjectAvailable(cdnUrl)) {
      return cdnUrl;
    }
  }

  const publicServerUrl = options.publicServerUrl?.trim();
  if (publicServerUrl && isPublicHttpOrigin(publicServerUrl)) {
    return buildOrgSiteOgApiUrl(siteName, publicServerUrl);
  }

  return `${options.pageOrigin}/proxy/org-site/og/${encodeURIComponent(siteName)}.png`;
}

export function resolveOrgSiteOgWarmUrl(options: {
  siteName: string;
  isSelfHosted: boolean;
  privateServerUrl?: string | null;
  publicServerUrl?: string | null;
}): string | null {
  const siteName = options.siteName.trim();
  if (!siteName) {
    return null;
  }

  const privateServerUrl = options.privateServerUrl?.trim();
  if (privateServerUrl && isPublicHttpOrigin(privateServerUrl)) {
    return buildOrgSiteOgApiUrl(siteName, privateServerUrl);
  }

  const publicServerUrl = options.publicServerUrl?.trim();
  if (publicServerUrl && isPublicHttpOrigin(publicServerUrl)) {
    return buildOrgSiteOgApiUrl(siteName, publicServerUrl);
  }

  if (!options.isSelfHosted) {
    return buildOrgSiteOgApiUrl(siteName, 'https://api.classroomio.com');
  }

  return null;
}
