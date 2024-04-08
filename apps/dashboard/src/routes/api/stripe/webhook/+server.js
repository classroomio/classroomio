import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    // Catch the event type
    // const clonedReq = request.clone();
    // const eventType = request.headers.get('X-Event-Name');
    const body = await request.json();

    // // Check signature
    // const secret = LEMON_SQUEEZY_WEBHOOK_SECRET;
    // const hmac = crypto.createHmac('sha256', secret);
    // const digest = Buffer.from(hmac.update(await clonedReq.text()).digest('hex'), 'utf8');
    // const signature = Buffer.from(request.headers.get('X-Signature') || '', 'utf8');

    // if (!crypto.timingSafeEqual(digest, signature)) {
    //   throw new Error('Invalid signature.');
    // }

    console.log(body);

    // Logic according to event
    // if (eventType === 'order_created') {
    //   const orgId = body.meta.custom_data.org_id;
    //   const triggeredBy = body.meta.custom_data.triggered_by;
    //   const isSuccessful = body.data.attributes.status === 'paid';

    //   console.log({
    //     orgId,
    //     triggeredBy,
    //     isSuccessful
    //   });

    //   if (isSuccessful) {
    //     const { error } = await createOrgPlan({
    //       orgId,
    //       triggeredBy,
    //       planName: PLAN.EARLY_ADOPTER,
    //       data: body.data
    //     });

    //     if (error) console.error('Error creating org plan', error);
    //   }
    // }

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
