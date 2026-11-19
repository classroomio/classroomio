import { CustomerPortal } from '@polar-sh/sveltekit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getAccountOrganizations } from '$features/settings/api/billing.server';
import { resolveBillingPortalAccess } from '$features/settings/utils/billing-portal-utils';
import type { RequestEvent } from './$types';

export const GET = async (event: RequestEvent) => {
  if (!event.locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const organizations = await getAccountOrganizations(event.cookies);
  if (!organizations) {
    return new Response('Could not load your account', { status: 502 });
  }

  const orgId = event.url.searchParams.get('orgId');
  const access = resolveBillingPortalAccess(organizations, orgId);

  if (access.status === 'forbidden') {
    return new Response('Only organization admins can manage billing', { status: 403 });
  }

  if (access.status === 'no-customer') {
    return new Response('No billing customer found for this organization', { status: 404 });
  }

  const customerId = access.customerId;
  const handler = CustomerPortal({
    accessToken: env.POLAR_ACCESS_TOKEN!,
    getCustomerId: async () => customerId,
    server: dev ? 'sandbox' : 'production'
  });

  return handler(event);
};
