import { CustomerPortal } from '@polar-sh/sveltekit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from './$types';

export const GET = async (event: RequestEvent) => {
  const { user, organizations } = event.locals;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = event.url.searchParams.get('orgId');
  const org = organizations?.find((candidate) => candidate.id === orgId);
  const customerId = org?.plan?.customerId;

  if (!customerId) {
    return new Response('No billing customer found for this organization', { status: 404 });
  }

  const handler = CustomerPortal({
    accessToken: env.POLAR_ACCESS_TOKEN!,
    getCustomerId: async () => customerId,
    server: dev ? 'sandbox' : 'production'
  });

  return handler(event);
};
