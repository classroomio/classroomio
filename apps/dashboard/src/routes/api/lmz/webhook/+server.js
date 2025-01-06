import { env } from '$env/dynamic/private';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { cancelOrgPlan, createOrgPlan } from '$lib/utils/services/org';
import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import { PLAN } from 'shared/src/plans/constants';

export async function POST({ request }) {
  try {
    const supabase = getServerSupabase();

    // Catch the event type
    const clonedReq = request.clone();
    const eventType = request.headers.get('X-Event-Name');
    const body = await request.json();

    // Check signature
    const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(await clonedReq.text()).digest('hex'), 'utf8');
    const signature = Buffer.from(request.headers.get('X-Signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      throw new Error('Invalid signature.');
    }

    console.log(body);

    // Logic according to event
    if (eventType === 'subscription_created' || eventType === 'subscription_resumed') {
      const orgId = body.meta.custom_data.org_id;
      const triggeredBy = body.meta.custom_data.triggered_by;
      const subscriptionId = body.data.id;
      const isSuccessful = body.data.attributes.status === 'active';

      console.log({
        subscriptionId,
        triggeredBy,
        isSuccessful
      });

      if (isSuccessful && orgId) {
        const { data, error } = await createOrgPlan({
          supabase,
          subscriptionId,
          orgId,
          triggeredBy: parseInt(triggeredBy),
          planName: PLAN.EARLY_ADOPTER,
          data: body.data
        });

        if (error) console.error('Error creating org plan', error);
        console.log('Create plan', data);
      }
    }

    if (
      ['subscription_cancelled', 'subscription_expired', 'subscription_payment_refunded'].includes(
        `${eventType}`
      )
    ) {
      const subscriptionId = body.data.id;
      const { data, error } = await cancelOrgPlan({
        subscriptionId,
        data: body.data
      });

      if (error) console.error('Error canceling org plan', error);
      console.log('Cancel plan', data);
    }

    return json({ message: 'Webhook received' });
  } catch (err) {
    console.error(err);
    return json({ message: 'Server error' }, { status: 500 });
  }
}

export function GET() {
  return json({
    success: true
  });
}
