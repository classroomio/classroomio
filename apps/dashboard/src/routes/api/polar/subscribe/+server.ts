import { Polar } from '@polar-sh/sdk';
import { PLANS } from '@cio/utils/plans';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from './$types';

const SUBSCRIPTION_PRODUCT_IDS = new Set(
  Object.values(PLANS)
    .flatMap((plan) => {
      const cta = plan.CTA as { PRODUCT_ID?: string; PRODUCT_ID_YEARLY?: string };
      return [cta.PRODUCT_ID, cta.PRODUCT_ID_YEARLY];
    })
    .filter((id): id is string => Boolean(id))
);

export const GET = async ({ url, locals }: RequestEvent) => {
  const { user, profile, organizations } = locals;

  if (!user || !profile) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = url.searchParams.get('orgId');
  const org = organizations?.find((candidate) => candidate.id === orgId);

  if (!org?.siteName || !org.member) {
    return new Response('You are not a member of this organization', { status: 403 });
  }

  const productId = url.searchParams.get('products');

  if (!productId || !SUBSCRIPTION_PRODUCT_IDS.has(productId)) {
    return new Response('Unknown product', { status: 400 });
  }

  if (!env.POLAR_ACCESS_TOKEN) {
    return new Response('POLAR_ACCESS_TOKEN is not configured', { status: 500 });
  }

  const polar = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: dev ? 'sandbox' : 'production'
  });

  const checkout = await polar.checkouts.create({
    products: [productId],
    customerEmail: profile.email ?? user.email,
    customerName: profile.fullname || undefined,
    successUrl: `${url.origin}/org/${org.siteName}?upgrade=true&confirmation=true`,
    metadata: {
      orgId: org.id,
      orgSlug: org.siteName,
      triggeredBy: String(org.member.id)
    }
  });

  return Response.redirect(checkout.url, 303);
};
