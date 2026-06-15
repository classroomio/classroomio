import { Polar } from '@polar-sh/sdk';
import { TOKEN_PACK } from '@cio/utils/plans';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from './$types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const GET = async ({ url, locals, cookies }: RequestEvent) => {
  const { user } = locals;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = url.searchParams.get('orgId');

  if (!orgId) {
    return new Response('Missing orgId', { status: 400 });
  }

  const accountResponse = await classroomio.account.$get(undefined, getApiHeaders(cookies));

  if (!accountResponse.ok) {
    return new Response('Failed to fetch account data', { status: 500 });
  }

  const accountData = await accountResponse.json();

  if (!accountData.success) {
    return new Response('Failed to fetch account data', { status: 500 });
  }

  const org = accountData.organizations?.find((candidate) => candidate.id === orgId);

  if (!org?.siteName) {
    return new Response('You are not a member of this organization', { status: 403 });
  }

  const quantityRaw = Number(url.searchParams.get('quantity') ?? '1');
  const quantity = Math.min(100, Math.max(1, Number.isFinite(quantityRaw) ? Math.trunc(quantityRaw) : 1));

  const productId = env.POLAR_TOKEN_PACK_PRODUCT_ID;

  if (!productId) {
    return new Response('POLAR_TOKEN_PACK_PRODUCT_ID is not configured', { status: 500 });
  }

  if (!env.POLAR_ACCESS_TOKEN) {
    return new Response('POLAR_ACCESS_TOKEN is not configured', { status: 500 });
  }

  const polar = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: dev ? 'sandbox' : 'production'
  });

  const totalPriceCents = TOKEN_PACK.PRICE_USD_CENTS * quantity;
  const customerEmail = (accountData.profile?.email ?? user.email)?.replace('@test.com', '+test@digdippa.com');

  const checkout = await polar.checkouts.create({
    products: [productId],
    prices: {
      [productId]: [
        {
          amountType: 'fixed',
          priceAmount: totalPriceCents,
          priceCurrency: 'usd'
        }
      ]
    },
    customerEmail,
    customerName: accountData.profile?.fullname || undefined,
    successUrl: `${url.origin}/org/${org.siteName}/settings/ai-credits?tokens=success`,
    metadata: {
      kind: 'token_pack',
      orgId: org.id,
      orgSlug: org.siteName,
      triggeredBy: accountData.profile?.id ?? user.id,
      tokensPerUnit: String(TOKEN_PACK.TOKENS_PER_UNIT),
      quantity: String(quantity)
    }
  });

  return Response.redirect(checkout.url, 303);
};
