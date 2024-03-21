import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from '$env/static/private';

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
    if (eventType === 'order_created') {
      const orgId = body.meta.custom_data.org_id;
      const profileId = body.meta.custom_data.profile_id;
      const isSuccessful = body.data.attributes.status === 'paid';

      console.log({
        orgId,
        profileId,
        isSuccessful
      });
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
