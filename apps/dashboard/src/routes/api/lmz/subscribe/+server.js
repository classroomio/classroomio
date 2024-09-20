import { json } from '@sveltejs/kit';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { env } from '$env/dynamic/private';
import { configureLemonSqueezy } from '$lib/utils/services/lemonsqueezy';

export async function POST({ request }) {
  const { email, name, orgId, productId, triggeredBy } = await request.json();

  await configureLemonSqueezy();

  if (!productId) {
    return json({ success: false, message: 'Product Id is required' }, { status: 400 });
  }

  const checkoutData = {
    email: email,
    name: name,
    custom: {
      org_id: orgId,
      triggered_by: `${triggeredBy}`
    }
  };

  console.log({ checkoutData });

  const { data } = await createCheckout(env.LEMON_SQUEEZY_STORE_ID, productId, {
    checkoutData
  });

  const checkoutURL = data?.data.attributes.url;

  console.log({ checkoutURL });

  return json({
    success: true,
    checkoutURL
  });
}
