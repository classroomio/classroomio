import { getDomain, getDomainWithoutSuffix } from 'tldts';

export type HostOwnership = 'own' | 'foreign';

const MIN_BRAND_LENGTH = 3;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function registrableDomain(host: string): string {
  return getDomain(host) ?? host.toLowerCase();
}

/** The brand's name as it appears in its domain, e.g. `acme` for `acme.cloud`. */
export function brandSlug(domain: string): string {
  return normalize(getDomainWithoutSuffix(domain) ?? domain);
}

export function hostOwnership(host: string, brandDomain: string): HostOwnership {
  return registrableDomain(host) === brandDomain ? 'own' : 'foreign';
}

/** Whether HTML mentions the brand anywhere, markup included. Used for pages reached on another domain. */
export function mentionsBrand(html: string, brandDomain: string): boolean {
  const slug = brandSlug(brandDomain);
  if (slug.length < MIN_BRAND_LENGTH) return normalize(html).includes(normalize(brandDomain));

  return html.toLowerCase().includes(slug);
}

/**
 * Whether a page names itself after the brand in its title, site name or application name. A site hosted on the
 * brand's domain for someone else (a customer's space on a multi-tenant product) names itself after its owner.
 */
export function identifiesAsBrand(html: string, brandDomain: string): boolean {
  const slug = brandSlug(brandDomain);
  const head = html.slice(0, 200_000);
  const names = [
    head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1],
    head.match(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']*)/i)?.[1],
    head.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:site_name["']/i)?.[1],
    head.match(/<meta[^>]+name=["']application-name["'][^>]*content=["']([^"']*)/i)?.[1]
  ];

  return names.some((name) => name !== undefined && normalize(name).includes(slug));
}
