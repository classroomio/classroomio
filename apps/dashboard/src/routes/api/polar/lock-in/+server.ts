import { Polar } from '@polar-sh/sdk';
import { EARLY_ADOPTER_CLAIM_CHECKOUT_KIND, PLANS, isEarlyAdopterOfferActive } from '@cio/utils/plans';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from './$types';

const MARKETING_SITE_URL = dev ? 'http://localhost:5174' : 'https://classroomio.com';

function redirectToPricing(reason?: 'unavailable') {
  const pricingUrl = new URL('/pricing', MARKETING_SITE_URL);

  if (reason) {
    pricingUrl.searchParams.set('checkout', reason);
  }

  return Response.redirect(pricingUrl.toString(), 303);
}

/**
 * Public checkout for the Early Adopter plan that needs no account. The purchase is tagged so the Polar webhook
 * records it as an unclaimed plan and emails the buyer a link to connect it to an organization.
 */
export const GET = async ({ url }: RequestEvent) => {
  if (!isEarlyAdopterOfferActive()) {
    return redirectToPricing();
  }

  if (!env.POLAR_ACCESS_TOKEN) {
    console.error('lock-in error: POLAR_ACCESS_TOKEN is not configured');

    return redirectToPricing('unavailable');
  }

  const { PRODUCT_ID, PRODUCT_ID_YEARLY } = PLANS.EARLY_ADOPTER.CTA;
  const productId = url.searchParams.get('interval') === 'year' ? PRODUCT_ID_YEARLY : PRODUCT_ID;
  const polar = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: dev ? 'sandbox' : 'production'
  });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: new URL('/early-adopter/thanks', MARKETING_SITE_URL).toString(),
      metadata: { kind: EARLY_ADOPTER_CLAIM_CHECKOUT_KIND }
    });

    return Response.redirect(checkout.url, 303);
  } catch (error) {
    console.error('lock-in error:', error);

    return redirectToPricing('unavailable');
  }
};
