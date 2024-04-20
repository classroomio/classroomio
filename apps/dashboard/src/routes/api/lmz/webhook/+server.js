import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from '$env/static/private';
import { createOrgPlan, cancelOrgPlan } from '$lib/utils/services/org';
import { PLAN } from 'shared/src/plans/constants';

export async function POST({ request }) {
  try {
    // Catch the event type
    const clonedReq = request.clone();
    const eventType = request.headers.get('X-Event-Name');
    const body = await request.json();

    // Check signature
    const secret = LEMON_SQUEEZY_WEBHOOK_SECRET;
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
      const isSuccessful = body.data.attributes.status === 'active';

      console.log({
        orgId,
        triggeredBy,
        isSuccessful
      });

      if (isSuccessful && orgId) {
        const { data, error } = await createOrgPlan({
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
      const orgId = body.meta.custom_data.org_id;
      const { data, error } = await cancelOrgPlan({
        orgId,
        planName: PLAN.EARLY_ADOPTER
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
