import { configureLemonSqueezy } from '$lib/utils/services/lemonsqueezy';
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  const subscriptionId = url.searchParams.get('subscriptionId');

  await configureLemonSqueezy();

  if (!subscriptionId) {
    return json({ success: false, message: 'Subscription id is required' }, { status: 400 });
  }

  const response = await getSubscription(subscriptionId);
  const customerPortal = response?.data?.data?.attributes?.urls?.customer_portal;

  console.log({ customerPortal });

  return json({
    success: true,
    customerPortal
  });
}
