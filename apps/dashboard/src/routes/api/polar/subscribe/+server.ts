import { env } from '$env/dynamic/private';
import { Checkout } from 'polar-sveltekit';

export const GET = ({ ...params }) => {
  const metadata = JSON.parse(params.url.searchParams.get('metadata') ?? '{}');
  const successUrl = `/org/${metadata.orgSlug}?upgrade=true&confirmation=true`;

  const request = Checkout({
    accessToken: env.POLAR_ACCESS_TOKEN,
    successUrl
  });

  return request(params);
};
