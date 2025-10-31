import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import sendEmail from '$mail/sendEmail';
import { ProductInvite } from '$lib/utils/types';
import { ProductInviteService } from '$lib/utils/services/products/invite';
import { supabase } from '$lib/utils/functions/supabase.server';
import { ROLE } from '$lib/utils/constants/roles';

// API to notify teachers in group that a student has joined a product
export async function POST({ fetch, request }) {
  const body = await request.json();
  const { inviteId } = body as { inviteId: ProductInvite['id'] };

  console.log('/POST api/email/invite/product/complete', body);

  if (!inviteId) {
    return json({ success: false, message: 'Invite is required' }, { status: 400 });
  }

  const origin = dev ? `http://localhost:5173` : `https://app.${env.PRIVATE_APP_HOST}`;
  console.log('origin', origin);

  const productInviteService = new ProductInviteService(supabase);

  const invite = await productInviteService.getInvite(inviteId);

  if (!invite) {
    return json({ success: false, message: 'Invite not found' }, { status: 404 });
  }

  const teachersAndAdmins = await productInviteService.getGroupmembers(
    invite.items.map((item) => item.group_id),
    [ROLE.TUTOR, ROLE.ADMIN]
  );

  console.log('teachersAndAdmins', teachersAndAdmins);

  const emailData = teachersAndAdmins
    .map((teacher) => {
      if (!teacher.profile) return;

      const productItem = invite.items.find((item) => item.group_id === teacher.group_id);

      if (!productItem) return;

      const { type, product_name } = productItem;

      return {
        from: `"ClassroomIO" <notify@classroomio.comm>`,
        to: teacher.profile.email,
        subject: `A student just joined a ${type} in ${invite?.organization?.name || 'ClassroomIO'}`,
        content: `<p>Hey ${teacher.profile.fullname || 'there'},</p>
      <p>A student has been added to ${product_name}, which you manage as a teacher/admin.</p>
      
      <div>
        <a class="button" href="${origin}">
        Go to dashboard
        </a>
      </div>
    `
      };
    })
    .filter((item) => !!item);

  if (!emailData.length) {
    return json({ success: true, message: 'No email to send' });
  }

  await sendEmail(fetch)(emailData);

  return json({
    success: true,
    message: 'Email sent'
  });
}
