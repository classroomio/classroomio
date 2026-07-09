export function getOrgSiteOgObjectKey(siteName: string): string {
  return `og/${encodeURIComponent(siteName)}.png`;
}

export function buildOrgSiteOgCdnUrl(siteName: string, cdnBaseUrl: string): string {
  return `${cdnBaseUrl.replace(/\/$/, '')}/${getOrgSiteOgObjectKey(siteName)}`;
}

export function buildOrgSiteOgApiUrl(siteName: string, apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}/org-site/og/${encodeURIComponent(siteName)}.png`;
}
