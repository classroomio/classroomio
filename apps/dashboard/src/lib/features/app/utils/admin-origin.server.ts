import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { isLocalOrPrivateHost } from '@cio/utils/functions';

const DEFAULT_ADMIN_SUBDOMAIN = 'app';

/**
 * Origin of the admin dashboard for links leaving a public org site.
 * Self-hosted and local hosts share one origin; otherwise it is `<admin subdomain>.<PRIVATE_APP_HOST>`.
 * Returns null when the admin host cannot be determined.
 */
export function getAdminOrigin(url: URL): string | null {
  const isSharedOrigin =
    PUBLIC_IS_SELFHOSTED === 'true' || url.hostname === 'localhost' || isLocalOrPrivateHost(url.hostname);
  if (isSharedOrigin) return url.origin;

  const appHost = env.PRIVATE_APP_HOST;
  if (!appHost) return null;

  const adminSubdomain = env.PRIVATE_APP_SUBDOMAINS?.split(',')[0]?.trim() || DEFAULT_ADMIN_SUBDOMAIN;

  return `https://${adminSubdomain}.${appHost}`;
}
