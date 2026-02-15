import { CustomerPortal } from '@polar-sh/sveltekit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const GET = CustomerPortal({
  accessToken: env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (e) => e.url.searchParams.get('customerId')!,
  server: dev ? 'sandbox' : 'production'
});
