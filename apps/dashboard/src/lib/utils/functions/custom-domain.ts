import { env } from '$env/dynamic/private';
import { isLocalOrPrivateHost } from '@cio/utils/functions';

/**
 * True when a request arrived on a customer's BYOD domain rather than a host we
 * own. BYOD domains are fronted by Approximated's edge instead of the tenant
 * Worker, so they need proxy-specific response handling.
 */
export function isCustomDomainHost(url: URL): boolean {
  if (url.host.includes('localhost') || isLocalOrPrivateHost(url.hostname)) {
    return false;
  }

  const appHosts = [env.PRIVATE_APP_HOST || '', 'classroomio.com', 'myclassroomio.com'].filter(Boolean);

  return !appHosts.some((host) => url.host.endsWith(host));
}
